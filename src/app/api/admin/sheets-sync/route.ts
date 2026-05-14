import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { appendSaleToSheet, getExistingOrderIds } from "@/lib/sheets/append";

/**
 * POST /api/admin/sheets-sync
 * Syncs PAID orders to Google Sheets, skipping orders already present.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paidOrders = await prisma.order.findMany({
    where: { status: "PAID" },
    include: { show: true, tier: true },
    orderBy: { paidAt: "asc" },
  });

  // Read existing order IDs from the sheet to avoid duplicates
  let existingIds: Set<string>;
  try {
    existingIds = await getExistingOrderIds();
  } catch (e) {
    console.error("[Sheets Sync] Failed to read existing rows:", e);
    existingIds = new Set();
  }

  const newOrders = paidOrders.filter((o) => !existingIds.has(o.id));

  const results: { orderId: string; ok: boolean; error?: string }[] = [];

  for (const order of newOrders) {
    try {
      await appendSaleToSheet({
        timestamp: order.paidAt?.toISOString() ?? order.createdAt.toISOString(),
        orderId: order.id,
        paymentId: order.mpPaymentId ?? "",
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
      results.push({ orderId: order.id, ok: true });
    } catch (e) {
      results.push({
        orderId: order.id,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({
    total: paidOrders.length,
    alreadyInSheet: existingIds.size,
    synced: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
