import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";
import { fulfillOrder } from "@/lib/orders/fulfill";

const claimSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
});

// POST /api/invites/[token]/claim — guest fills their data, tickets are generated
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;

  try {
    const body = await req.json();
    const data = claimSchema.parse(body);

    // Find the invite
    const invite = await prisma.guestInvite.findUnique({
      where: { token },
      include: { show: true },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
    }
    if (invite.status !== "PENDING") {
      return NextResponse.json(
        { error: invite.status === "CLAIMED" ? "Esta invitación ya fue utilizada" : "Invitación expirada" },
        { status: 410 }
      );
    }

    // Find or create the hidden "Invitados" tier
    let guestTier = await prisma.ticketTier.findFirst({
      where: { showId: invite.showId, name: "Invitados" },
    });

    if (!guestTier) {
      guestTier = await prisma.ticketTier.create({
        data: {
          showId: invite.showId,
          name: "Invitados",
          priceArs: 0,
          capacity: 9999,
          isActive: false,
          sortOrder: 999,
        },
      });
    }

    // Create the GUEST order
    const order = await prisma.order.create({
      data: {
        showId: invite.showId,
        tierId: guestTier.id,
        buyerName: data.name,
        buyerEmail: data.email,
        buyerPhone: data.phone,
        quantity: invite.quantity,
        unitPriceArs: 0,
        totalArs: 0,
        paymentMethod: "GUEST",
        status: "PENDING", // fulfillOrder sets it to PAID
      },
    });

    // Mark invite as claimed
    await prisma.guestInvite.update({
      where: { id: invite.id },
      data: {
        status: "CLAIMED",
        orderId: order.id,
        claimedAt: new Date(),
      },
    });

    // Generate tickets + send email
    const result = await fulfillOrder({
      orderId: order.id,
      paymentReference: invite.label ? `invite:${invite.label}` : "invite",
    });

    if (!result.success) {
      // Revert claim on failure
      await prisma.guestInvite.update({
        where: { id: invite.id },
        data: { status: "PENDING", orderId: null, claimedAt: null },
      });
      await prisma.order.delete({ where: { id: order.id } });
      return NextResponse.json(
        { error: result.error || "Error al procesar la invitación" },
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
    console.error("Claim error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
