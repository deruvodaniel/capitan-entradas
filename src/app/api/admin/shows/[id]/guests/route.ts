import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { fulfillOrder } from "@/lib/orders/fulfill";

// GET /api/admin/shows/[id]/guests — list guest orders for a show
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: showId } = await ctx.params;

  const guests = await prisma.order.findMany({
    where: { showId, paymentMethod: "GUEST" },
    include: { tickets: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(guests);
}

const createGuestSchema = z.object({
  guestName: z.string().min(1),
  guestEmail: z.email(),
  guestPhone: z.string().optional(),
  companions: z.int().min(0).max(10).default(0),
  notes: z.string().optional(),
});

// POST /api/admin/shows/[id]/guests — add a guest (creates free GUEST order + tickets + sends email)
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: showId } = await ctx.params;

  try {
    const body = await req.json();
    const data = createGuestSchema.parse(body);

    const show = await prisma.show.findUnique({ where: { id: showId } });
    if (!show) {
      return NextResponse.json({ error: "Show no encontrado" }, { status: 404 });
    }

    // Find or create the hidden "Invitados" tier for this show
    const guestTier = await prisma.ticketTier.upsert({
      where: {
        // Use a compound unique — we need to add one or use findFirst+create
        id: (
          await prisma.ticketTier.findFirst({
            where: { showId, name: "Invitados" },
            select: { id: true },
          })
        )?.id ?? "nonexistent",
      },
      create: {
        showId,
        name: "Invitados",
        priceArs: 0,
        capacity: 9999,
        isActive: false, // hidden from public buy form
        sortOrder: 999,
      },
      update: {}, // no updates needed if it exists
    });

    const quantity = 1 + data.companions;

    // Create the order as PAID directly (no checkout flow)
    const order = await prisma.order.create({
      data: {
        showId,
        tierId: guestTier.id,
        buyerName: data.guestName,
        buyerEmail: data.guestEmail,
        buyerPhone: data.guestPhone,
        buyerDni: null,
        quantity,
        unitPriceArs: 0,
        totalArs: 0,
        paymentMethod: "GUEST",
        status: "PENDING", // fulfillOrder will set it to PAID
      },
    });

    // Run full fulfillment: generates tickets, sends email, appends to sheets
    const result = await fulfillOrder({
      orderId: order.id,
      paymentReference: data.notes ? `guest:${data.notes}` : "guest",
    });

    if (!result.success) {
      // Clean up on failure
      await prisma.order.delete({ where: { id: order.id } });
      return NextResponse.json(
        { error: result.error || "Error al crear invitado" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Guest POST error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE /api/admin/shows/[id]/guests?orderId=xxx — remove a guest
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: showId } = await ctx.params;
  const orderId = new URL(req.url).searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || order.showId !== showId || order.paymentMethod !== "GUEST") {
    return NextResponse.json({ error: "Invitado no encontrado" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.ticket.deleteMany({ where: { orderId } }),
    prisma.order.delete({ where: { id: orderId } }),
  ]);

  return NextResponse.json({ ok: true });
}
