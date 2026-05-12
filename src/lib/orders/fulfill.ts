import { prisma } from "@/lib/db";
import { generateQrToken } from "@/lib/tickets/qr";
import { generateTicketCode } from "@/lib/tickets/code";
import { sendTicketEmail } from "@/lib/email/service";
import { appendSaleToSheet } from "@/lib/sheets/append";
import { getBaseUrl, formatDate } from "@/lib/utils";

interface FulfillResult {
  success: boolean;
  error?: string;
}

interface FulfillOptions {
  orderId: string;
  mpPaymentId?: string;
  mpStatusDetail?: string;
  paymentReference?: string; // for sheets payment_id column
}

/**
 * Fulfills an order: checks capacity, generates tickets, updates order to PAID,
 * sends email with ticket links, and appends sale to Google Sheets.
 *
 * Reusable from both the MP webhook (automatic) and admin confirmation (manual).
 * Idempotent: if the order is already PAID, returns success without doing anything.
 */
export async function fulfillOrder(
  opts: FulfillOptions
): Promise<FulfillResult> {
  const order = await prisma.order.findUnique({
    where: { id: opts.orderId },
    include: {
      show: true,
      tier: true,
      tickets: true,
    },
  });

  if (!order) {
    return { success: false, error: "order_not_found" };
  }

  // Idempotency: already fulfilled
  if (order.status === "PAID") {
    return { success: true };
  }

  // Atomic capacity check + increment
  const result = await prisma.$executeRawUnsafe(
    `UPDATE "TicketTier" SET "soldCount" = "soldCount" + $1 WHERE id = $2 AND "soldCount" + $1 <= capacity`,
    order.quantity,
    order.tierId
  );

  if (result === 0) {
    return { success: false, error: "oversold" };
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

  // Atomic: update order to PAID + create all tickets
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        mpPaymentId: opts.mpPaymentId ?? undefined,
        mpStatusDetail: opts.mpStatusDetail ?? undefined,
        paidAt: new Date(),
      },
    }),
    ...tickets.map((t) => prisma.ticket.create({ data: t })),
  ]);

  // Send email (non-blocking for the caller, but awaited for serverless)
  const baseUrl = getBaseUrl();
  const ticketUrls = tickets.map((t) => `${baseUrl}/ticket/${t.code}`);

  try {
    await sendTicketEmail({
      to: order.buyerEmail,
      buyerName: order.buyerName,
      showTitle: order.show.title,
      showDate: formatDate(order.show.startsAt),
      venue: order.show.venue,
      address: order.show.address ?? undefined,
      tierName: order.tier.name,
      quantity: order.quantity,
      ticketUrls,
    });
    console.log("Email sent to", order.buyerEmail);
  } catch (e) {
    console.error("Email send failed:", e);
  }

  // Append to Google Sheets
  try {
    await appendSaleToSheet({
      timestamp: new Date().toISOString(),
      orderId: order.id,
      paymentId: opts.paymentReference ?? opts.mpPaymentId ?? "manual",
      showTitle: order.show.title,
      showDate: order.show.startsAt.toISOString(),
      tier: order.tier.name,
      quantity: order.quantity,
      totalArs: order.totalArs,
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
      buyerDni: order.buyerDni || "",
      buyerPhone: order.buyerPhone || "",
    });
    console.log("Sheet row appended for order", order.id);
  } catch (e) {
    console.error("Sheets append failed:", e);
  }

  return { success: true };
}
