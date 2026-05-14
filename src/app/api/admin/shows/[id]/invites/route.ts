import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

const createSchema = z.object({
  quantity: z.int().min(1).max(10).default(1),
  label: z.string().optional(),
});

// POST — create a guest invite link
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
    const data = createSchema.parse(body);

    const show = await prisma.show.findUnique({ where: { id: showId } });
    if (!show) {
      return NextResponse.json({ error: "Show no encontrado" }, { status: 404 });
    }

    const invite = await prisma.guestInvite.create({
      data: {
        showId,
        quantity: data.quantity,
        label: data.label || null,
      },
    });

    return NextResponse.json({ ok: true, token: invite.token, id: invite.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Invite POST error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// GET — list invites for a show
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: showId } = await ctx.params;

  const invites = await prisma.guestInvite.findMany({
    where: { showId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invites);
}

// DELETE — remove an invite
export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const inviteId = new URL(req.url).searchParams.get("inviteId");
  if (!inviteId) {
    return NextResponse.json({ error: "inviteId requerido" }, { status: 400 });
  }

  await prisma.guestInvite.delete({ where: { id: inviteId } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
