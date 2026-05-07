import { prisma } from "@/lib/db";
import { formatArs, formatDate } from "@/lib/utils";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      show: { select: { title: true } },
      tier: { select: { name: true } },
      tickets: { select: { code: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const statusColors: Record<string, string> = {
    PAID: "text-green-400 bg-green-500/20",
    PENDING: "text-yellow-400 bg-yellow-500/20",
    FAILED: "text-red-400 bg-red-500/20",
    EXPIRED: "text-muted bg-muted/20",
    REFUNDED: "text-orange-400 bg-orange-500/20",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ventas</h1>

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
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-card-border/50">
                  <td className="py-3 text-muted">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="py-3">{order.show.title}</td>
                  <td className="py-3">
                    <div>{order.buyerName}</div>
                    <div className="text-xs text-muted">{order.buyerEmail}</div>
                  </td>
                  <td className="py-3">{order.tier.name}</td>
                  <td className="py-3">{order.quantity}</td>
                  <td className="py-3 font-medium">
                    {formatArs(order.totalArs)}
                  </td>
                  <td className="py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || ""}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {order.tickets.map((t) => (
                        <span
                          key={t.code}
                          className={`text-xs font-mono ${
                            t.status === "CHECKED_IN"
                              ? "text-green-400"
                              : t.status === "VOIDED"
                                ? "text-red-400 line-through"
                                : "text-muted"
                          }`}
                        >
                          {t.code}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
