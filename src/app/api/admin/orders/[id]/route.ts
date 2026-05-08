import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { generateQrDataUrl } from "@/lib/tickets/qr";
import { getBaseUrl } from "@/lib/utils";
import { fulfillOrder } from "@/lib/orders/fulfill";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      show: true,
      tier: true,
      tickets: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const baseUrl = getBaseUrl();
  const ticketsWithQr = await Promise.all(
    order.tickets.map(async (t) => ({
      id: t.id,
      code: t.code,
      status: t.status,
      checkedInAt: t.checkedInAt,
      checkedInBy: t.checkedInBy,
      url: `${baseUrl}/ticket/${t.code}`,
      qrDataUrl:
        t.status === "VALID" || t.status === "CHECKED_IN"
          ? await generateQrDataUrl(t.qrToken)
          : null,
    }))
  );

  return NextResponse.json({
    ...order,
    tickets: ticketsWithQr,
  });
}

const patchSchema = z.object({
  buyerName: z.string().min(1).optional(),
  buyerEmail: z.email().optional(),
  buyerDni: z.string().optional().nullable(),
  status: z
    .enum(["PENDING", "PAID", "FAILED", "EXPIRED", "REFUNDED"])
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const data = patchSchema.parse(body);

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    const wasPaid = order.status === "PAID";
    const goingPaid = data.status === "PAID" && !wasPaid;
    const leavingPaid = wasPaid && data.status && data.status !== "PAID";

    // If transitioning to PAID: run full fulfillment (capacity check, tickets, email, sheets)
    if (goingPaid) {
      const result = await fulfillOrder({
        orderId: id,
        paymentReference: "transfer-admin",
      });

      if (!result.success) {
        if (result.error === "oversold") {
          return NextResponse.json(
            { error: "No hay suficiente cupo" },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: result.error || "Error al procesar" },
          { status: 500 }
        );
      }

      // If there are also buyer data edits, apply them
      if (data.buyerName || data.buyerEmail || data.buyerDni !== undefined) {
        await prisma.order.update({
          where: { id },
          data: {
            buyerName: data.buyerName,
            buyerEmail: data.buyerEmail,
            buyerDni: data.buyerDni === null ? null : data.buyerDni,
          },
        });
      }

      return NextResponse.json({ ok: true });
    }

    // If leaving PAID: decrement capacity + void tickets
    if (leavingPaid) {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(
          `UPDATE "TicketTier" SET "soldCount" = GREATEST("soldCount" - $1, 0) WHERE id = $2`,
          order.quantity,
          order.tierId
        );
        await tx.ticket.updateMany({
          where: { orderId: id },
          data: { status: "VOIDED" },
        });
        await tx.order.update({
          where: { id },
          data: {
            buyerName: data.buyerName,
            buyerEmail: data.buyerEmail,
            buyerDni: data.buyerDni === null ? null : data.buyerDni,
            status: data.status,
          },
        });
      });

      return NextResponse.json({ ok: true });
    }

    // Regular update (no status transition, or status change that doesn't involve PAID)
    await prisma.order.update({
      where: { id },
      data: {
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        buyerDni: data.buyerDni === null ? null : data.buyerDni,
        status: data.status,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Order PATCH error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      if (order.status === "PAID") {
        await tx.$executeRawUnsafe(
          `UPDATE "TicketTier" SET "soldCount" = GREATEST("soldCount" - $1, 0) WHERE id = $2`,
          order.quantity,
          order.tierId
        );
      }
      await tx.ticket.deleteMany({ where: { orderId: id } });
      await tx.order.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Order DELETE error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
