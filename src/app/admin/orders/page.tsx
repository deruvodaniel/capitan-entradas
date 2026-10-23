import { prisma } from "@/lib/db";
import OrdersTable from "@/components/OrdersTable";
import SheetsSyncButton from "@/components/SheetsSyncButton";
import OrderShowFilter from "@/components/OrderShowFilter";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ showId?: string | string[] }>;
}) {
  const { showId } = await searchParams;
  const shows = await prisma.show.findMany({
    select: { id: true, title: true, startsAt: true, archivedAt: true },
    orderBy: { startsAt: "desc" },
  });
  const selectedShowId =
    typeof showId === "string" && shows.some((show) => show.id === showId)
      ? showId
      : "";

  const orders = await prisma.order.findMany({
    where: selectedShowId ? { showId: selectedShowId } : undefined,
    include: {
      show: { select: { title: true } },
      tier: { select: { name: true } },
      tickets: { select: { code: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Ventas</h1>
        <div className="flex items-center gap-4">
          <SheetsSyncButton />
          <span className="text-sm text-muted">
            {orders.length} {orders.length === 1 ? "orden" : "órdenes"}
          </span>
        </div>
      </div>

      <OrderShowFilter
        selectedShowId={selectedShowId}
        shows={shows.map((show) => ({
          id: show.id,
          label: `${show.title} · ${show.startsAt.toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "America/Argentina/Buenos_Aires",
          })}${show.archivedAt ? " (archivado)" : ""}`,
        }))}
      />
      <OrdersTable key={selectedShowId || "all"} orders={orders} />
    </div>
  );
}
