import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { verifyQrToken } from "@/lib/tickets/qr";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { qrToken } = await req.json();
    if (!qrToken || typeof qrToken !== "string") {
      return NextResponse.json(
        { ok: false, reason: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    let payload;
    try {
      payload = verifyQrToken(qrToken);
    } catch {
      return NextResponse.json(
        { ok: false, reason: "INVALID_SIGNATURE" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: payload.tid },
      include: {
        order: {
          include: { show: true, tier: true },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ ok: false, reason: "NOT_FOUND" });
    }

    if (ticket.qrToken !== qrToken) {
      return NextResponse.json({ ok: false, reason: "REVOKED" });
    }

    if (ticket.order.showId !== payload.sid) {
      return NextResponse.json({ ok: false, reason: "WRONG_SHOW" });
    }

    if (ticket.status === "CHECKED_IN") {
      return NextResponse.json({
        ok: false,
        reason: "ALREADY_USED",
        checkedInAt: ticket.checkedInAt,
      });
    }

    if (ticket.status === "VOIDED") {
      return NextResponse.json({ ok: false, reason: "VOIDED" });
    }

    // Atomic check-in: only succeeds if status is still VALID
    const updated = await prisma.ticket.updateMany({
      where: { id: ticket.id, status: "VALID" },
      data: {
        status: "CHECKED_IN",
        checkedInAt: new Date(),
        checkedInBy: userId,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({
        ok: false,
        reason: "ALREADY_USED",
      });
    }

    return NextResponse.json({
      ok: true,
      ticket: {
        code: ticket.code,
        buyerName: ticket.order.buyerName,
        tier: ticket.order.tier.name,
        show: ticket.order.show.title,
        checkedInAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
