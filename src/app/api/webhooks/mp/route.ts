import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPayment, refundPayment } from "@/lib/mp/client";
import { verifyMpSignature } from "@/lib/mp/signature";
import { generateQrToken } from "@/lib/tickets/qr";
import { generateTicketCode } from "@/lib/tickets/code";
import { sendTicketEmail } from "@/lib/email/service";
import { appendSaleToSheet } from "@/lib/sheets/append";
import { getBaseUrl, formatDate } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || url.searchParams.get("topic");
    const dataId =
      url.searchParams.get("data.id") || url.searchParams.get("id");

    if (type !== "payment" || !dataId) {
      return NextResponse.json({ ok: true });
    }

    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    if (!verifyMpSignature(xSignature, xRequestId, dataId)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Idempotency check
    try {
      await prisma.webhookEvent.create({
        data: {
          provider: "mercadopago",
          eventType: "payment",
          externalId: dataId,
          rawPayload: Object.fromEntries(url.searchParams.entries()),
        },
      });
    } catch (err: unknown) {
      // Only treat unique constraint violations as "already processed"
      const isUniqueViolation =
        err instanceof Error &&
        (err.message.includes("Unique constraint") ||
          err.message.includes("unique constraint") ||
          (err as { code?: string }).code === "P2002");
      if (isUniqueViolation) {
        return NextResponse.json({ ok: true });
      }
      throw err; // Re-throw transient DB errors so MP retries
    }

    const payment = await getPayment(dataId);
    const orderId = payment.external_reference;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { show: true, tier: true },
    });

    if (!order) {
      await prisma.webhookEvent.update({
        where: {
          provider_externalId: { provider: "mercadopago", externalId: dataId },
        },
        data: {
          error: `Order not found: ${orderId}`,
          processedAt: new Date(),
        },
      });
      return NextResponse.json({ ok: true });
    }

    // Validate amounts match
    const expectedAmount = order.totalArs / 100;
    if (
      Math.abs(payment.transaction_amount - expectedAmount) > 0.01 ||
      payment.currency_id !== "ARS"
    ) {
      await prisma.webhookEvent.update({
        where: {
          provider_externalId: { provider: "mercadopago", externalId: dataId },
        },
        data: {
          error: `Amount mismatch: expected ${expectedAmount} ARS, got ${payment.transaction_amount} ${payment.currency_id}`,
          processedAt: new Date(),
        },
      });
      console.error("Amount mismatch for order", orderId);
      return NextResponse.json({ ok: true });
    }

    // Guard: don't re-process already PAID orders
    if (order.status === "PAID" && payment.status === "approved") {
      await prisma.webhookEvent.update({
        where: {
          provider_externalId: { provider: "mercadopago", externalId: dataId },
        },
        data: { processedAt: new Date() },
      });
      return NextResponse.json({ ok: true });
    }

    switch (payment.status) {
      case "approved":
        await handleApproved(order, payment, dataId);
        break;
      case "rejected":
      case "cancelled":
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "FAILED",
            mpPaymentId: String(payment.id),
            mpStatusDetail: payment.status_detail,
          },
        });
        break;
      case "refunded":
      case "charged_back":
        await prisma.$transaction([
          prisma.order.update({
            where: { id: orderId },
            data: { status: "REFUNDED" },
          }),
          prisma.ticket.updateMany({
            where: { orderId },
            data: { status: "VOIDED" },
          }),
        ]);
        break;
      // in_process, pending — no-op, wait for next event
    }

    await prisma.webhookEvent.update({
      where: {
        provider_externalId: { provider: "mercadopago", externalId: dataId },
      },
      data: { processedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}

interface OrderWithRelations {
  id: string;
  showId: string;
  tierId: string;
  quantity: number;
  totalArs: number;
  buyerName: string;
  buyerEmail: string;
  buyerDni: string | null;
  show: { title: string; startsAt: Date; venue: string };
  tier: { name: string; capacity: number };
}

async function handleApproved(
  order: OrderWithRelations,
  payment: { id: number; status_detail: string },
  dataId: string
) {
  // Atomic capacity check + order update
  const result = await prisma.$executeRawUnsafe(
    `UPDATE "TicketTier" SET "soldCount" = "soldCount" + $1 WHERE id = $2 AND "soldCount" + $1 <= capacity`,
    order.quantity,
    order.tierId
  );

  if (result === 0) {
    // Oversold — refund
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "FAILED",
        mpPaymentId: String(payment.id),
        mpStatusDetail: "oversold_refunded",
      },
    });
    try {
      await refundPayment(String(payment.id));
    } catch (e) {
      console.error("Refund failed for payment", payment.id, e);
    }
    return;
  }

  // Generate tickets
  const tickets = Array.from({ length: order.quantity }, () => {
    const ticketId = crypto.randomUUID().replace(/-/g, "").slice(0, 25);
    const code = generateTicketCode();
    const qrToken = generateQrToken(
      ticketId,
      order.id,
      order.showId,
      order.show.startsAt
    );
    return { id: ticketId, orderId: order.id, code, qrToken };
  });

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        mpPaymentId: String(payment.id),
        mpStatusDetail: payment.status_detail,
        paidAt: new Date(),
      },
    }),
    ...tickets.map((t) => prisma.ticket.create({ data: t })),
  ]);

  // Send email (non-blocking for webhook response)
  const baseUrl = getBaseUrl();
  const ticketUrls = tickets.map((t) => `${baseUrl}/ticket/${t.code}`);

  sendTicketEmail({
    to: order.buyerEmail,
    buyerName: order.buyerName,
    showTitle: order.show.title,
    showDate: formatDate(order.show.startsAt),
    venue: order.show.venue,
    tierName: order.tier.name,
    quantity: order.quantity,
    ticketUrls,
  }).catch((e) => console.error("Email send failed:", e));

  // Append to Google Sheets (non-blocking)
  appendSaleToSheet({
    timestamp: new Date().toISOString(),
    orderId: order.id,
    paymentId: dataId,
    showTitle: order.show.title,
    showDate: order.show.startsAt.toISOString(),
    tier: order.tier.name,
    quantity: order.quantity,
    totalArs: order.totalArs,
    buyerName: order.buyerName,
    buyerEmail: order.buyerEmail,
    buyerDni: order.buyerDni || "",
  }).catch((e) => console.error("Sheets append failed:", e));
}
