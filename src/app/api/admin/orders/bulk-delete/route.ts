import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

const schema = z.object({
  orderIds: z.array(z.string()).min(1),
});

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { orderIds } = schema.parse(body);

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, status: true, quantity: true, tierId: true },
    });

    await prisma.$transaction(async (tx) => {
      // Free capacity for PAID orders
      for (const order of orders) {
        if (order.status === "PAID") {
          await tx.$executeRawUnsafe(
            `UPDATE "TicketTier" SET "soldCount" = GREATEST("soldCount" - $1, 0) WHERE id = $2`,
            order.quantity,
            order.tierId
          );
        }
      }
      // Delete tickets then orders
      await tx.ticket.deleteMany({ where: { orderId: { in: orderIds } } });
      await tx.order.deleteMany({ where: { id: { in: orderIds } } });
    });

    return NextResponse.json({ ok: true, deleted: orders.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    console.error("Bulk delete error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
