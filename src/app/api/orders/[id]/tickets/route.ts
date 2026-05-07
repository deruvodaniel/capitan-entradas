import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateQrDataUrl } from "@/lib/tickets/qr";
import { getBaseUrl } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      status: true,
      tickets: {
        select: { code: true, qrToken: true, status: true },
        where: { status: "VALID" },
      },
    },
  });

  if (!order || order.status !== "PAID" || order.tickets.length === 0) {
    return NextResponse.json({ tickets: [] });
  }

  const baseUrl = getBaseUrl();
  const tickets = await Promise.all(
    order.tickets.map(async (t) => ({
      code: t.code,
      url: `${baseUrl}/ticket/${t.code}`,
      qrDataUrl: await generateQrDataUrl(t.qrToken),
    }))
  );

  return NextResponse.json({ tickets });
}
