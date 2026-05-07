import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { generateQrDataUrl } from "@/lib/tickets/qr";
import { getBaseUrl } from "@/lib/utils";

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
      qrDataUrl: t.status === "VALID" || t.status === "CHECKED_IN"
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

    // If transitioning to PAID and previously not PAID: increment soldCount
    // If transitioning from PAID to something else: decrement soldCount + void tickets
    const wasPaid = order.status === "PAID";
    const goingPaid = data.status === "PAID" && !wasPaid;
    const leavingPaid = wasPaid && data.status && data.status !== "PAID";

    await prisma.$transaction(async (tx) => {
      if (goingPaid) {
        await tx.$executeRawUnsafe(
          `UPDATE "TicketTier" SET "soldCount" = "soldCount" + $1 WHERE id = $2`,
          order.quantity,
          order.tierId
        );
      }
      if (leavingPaid) {
        await tx.$executeRawUnsafe(
          `UPDATE "TicketTier" SET "soldCount" = GREATEST("soldCount" - $1, 0) WHERE id = $2`,
          order.quantity,
          order.tierId
        );
        await tx.ticket.updateMany({
          where: { orderId: id },
          data: { status: "VOIDED" },
        });
      }

      await tx.order.update({
        where: { id },
        data: {
          buyerName: data.buyerName,
          buyerEmail: data.buyerEmail,
          buyerDni: data.buyerDni === null ? null : data.buyerDni,
          status: data.status,
          paidAt: goingPaid ? new Date() : undefined,
        },
      });
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
      // If was PAID, free up capacity
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
