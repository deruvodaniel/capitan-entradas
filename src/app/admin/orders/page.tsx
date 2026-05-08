import { prisma } from "@/lib/db";
import OrdersTable from "@/components/OrdersTable";
import SheetsSyncButton from "@/components/SheetsSyncButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
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
            {orders.length} {orders.length === 1 ? "orden" : "ordenes"}
          </span>
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="text-muted text-center py-12">No hay ordenes todavia.</p>
      ) : (
        <OrdersTable orders={orders} />
      )}
    </div>
  );
}
