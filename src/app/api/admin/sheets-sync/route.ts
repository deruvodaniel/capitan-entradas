import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import {
  appendSaleToSheet,
  getExistingOrderIds,
  DEFAULT_SHEET_TAB,
} from "@/lib/sheets/append";

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

  // Cada show escribe en su propia pestaña, así que los IDs ya presentes se
  // leen por pestaña. Los shows sin `sheetTab` son los previos a esa columna
  // y siguen usando la histórica "Ventas".
  const tabOf = (o: (typeof paidOrders)[number]) =>
    o.show.sheetTab ?? DEFAULT_SHEET_TAB;

  const existingByTab = new Map<string, Set<string>>();
  for (const tab of new Set(paidOrders.map(tabOf))) {
    try {
      existingByTab.set(tab, await getExistingOrderIds(tab));
    } catch (e) {
      console.error(`[Sheets Sync] Failed to read existing rows on "${tab}":`, e);
      existingByTab.set(tab, new Set());
    }
  }

  const alreadyInSheet = [...existingByTab.values()].reduce(
    (n, s) => n + s.size,
    0
  );

  const newOrders = paidOrders.filter(
    (o) => !existingByTab.get(tabOf(o))?.has(o.id)
  );

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
      }, tabOf(order));
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
    alreadyInSheet,
    synced: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
