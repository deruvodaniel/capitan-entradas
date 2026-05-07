import { prisma } from "@/lib/db";
import OrderRow from "@/components/OrderRow";

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ventas</h1>
        <span className="text-sm text-muted">
          {orders.length} {orders.length === 1 ? "orden" : "órdenes"}
        </span>
      </div>

      {orders.length === 0 ? (
        <p className="text-muted text-center py-12">No hay órdenes todavía.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-card-border">
                <th className="pb-3 font-medium">Fecha</th>
                <th className="pb-3 font-medium">Show</th>
                <th className="pb-3 font-medium">Comprador</th>
                <th className="pb-3 font-medium">Tier</th>
                <th className="pb-3 font-medium">Cant.</th>
                <th className="pb-3 font-medium">Total</th>
                <th className="pb-3 font-medium">Estado</th>
                <th className="pb-3 font-medium">Entradas</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
