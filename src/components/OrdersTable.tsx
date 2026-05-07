"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatArs, formatDateShort } from "@/lib/utils";
import { Trash2, AlertTriangle } from "lucide-react";
import OrderDrawer from "./OrderDrawer";

type Status = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "REFUNDED";

interface Order {
  id: string;
  createdAt: Date | string;
  buyerName: string;
  buyerEmail: string;
  quantity: number;
  totalArs: number;
  status: Status;
  show: { title: string };
  tier: { name: string };
  tickets: { code: string; status: string }[];
}

const STATUS_COLORS: Record<Status, string> = {
  PAID: "text-green-400 bg-green-500/20",
  PENDING: "text-yellow-400 bg-yellow-500/20",
  FAILED: "text-red-400 bg-red-500/20",
  EXPIRED: "text-muted bg-muted/20",
  REFUNDED: "text-orange-400 bg-orange-500/20",
};

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const allChecked = checked.size === orders.length && orders.length > 0;

  function toggleAll() {
    if (allChecked) {
      setChecked(new Set());
    } else {
      setChecked(new Set(orders.map((o) => o.id)));
    }
  }

  function toggleOne(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/orders/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: Array.from(checked) }),
      });
      if (res.ok) {
        setChecked(new Set());
        setConfirmBulkDelete(false);
        startTransition(() => router.refresh());
      }
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Bulk action bar */}
      {checked.size > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-card border border-card-border rounded-xl px-4 py-3">
          <span className="text-sm font-medium">
            {checked.size} seleccionada{checked.size !== 1 ? "s" : ""}
          </span>
          <div className="flex-1" />
          {confirmBulkDelete ? (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">Confirmar borrado</span>
              <button
                onClick={bulkDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-xs bg-red-500 text-white font-medium rounded-lg hover:bg-red-400 disabled:opacity-50"
              >
                {deleting ? "Borrando..." : "Borrar"}
              </button>
              <button
                onClick={() => setConfirmBulkDelete(false)}
                className="px-3 py-1.5 text-xs text-muted hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmBulkDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" /> Borrar
            </button>
          )}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-card-border">
              <th className="pb-3 pr-2 w-8">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="rounded border-card-border accent-accent"
                />
              </th>
              <th className="pb-3 font-medium">Fecha</th>
              <th className="pb-3 font-medium hidden lg:table-cell">Show</th>
              <th className="pb-3 font-medium">Comprador</th>
              <th className="pb-3 font-medium">Tier</th>
              <th className="pb-3 font-medium text-center">Cant.</th>
              <th className="pb-3 font-medium">Total</th>
              <th className="pb-3 font-medium">Estado</th>
              <th className="pb-3 font-medium">Entradas</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-card-border/50 hover:bg-card/50 transition-colors"
              >
                <td
                  className="py-3 pr-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={checked.has(order.id)}
                    onChange={() => toggleOne(order.id)}
                    className="rounded border-card-border accent-accent"
                  />
                </td>
                <td
                  className="py-3 text-muted whitespace-nowrap cursor-pointer"
                  onClick={() => setSelectedId(order.id)}
                >
                  {formatDateShort(order.createdAt)}
                </td>
                <td
                  className="py-3 text-muted cursor-pointer hidden lg:table-cell"
                  onClick={() => setSelectedId(order.id)}
                >
                  {order.show.title}
                </td>
                <td
                  className="py-3 cursor-pointer"
                  onClick={() => setSelectedId(order.id)}
                >
                  <div className="font-medium">{order.buyerName}</div>
                  <div className="text-xs text-muted">{order.buyerEmail}</div>
                </td>
                <td
                  className="py-3 cursor-pointer"
                  onClick={() => setSelectedId(order.id)}
                >
                  {order.tier.name}
                </td>
                <td
                  className="py-3 text-center cursor-pointer"
                  onClick={() => setSelectedId(order.id)}
                >
                  {order.quantity}
                </td>
                <td
                  className="py-3 font-medium cursor-pointer"
                  onClick={() => setSelectedId(order.id)}
                >
                  {formatArs(order.totalArs)}
                </td>
                <td
                  className="py-3 cursor-pointer"
                  onClick={() => setSelectedId(order.id)}
                >
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td
                  className="py-3 cursor-pointer"
                  onClick={() => setSelectedId(order.id)}
                >
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

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-card border border-card-border rounded-xl overflow-hidden"
          >
            <div className="flex items-start gap-3 p-4">
              <input
                type="checkbox"
                checked={checked.has(order.id)}
                onChange={() => toggleOne(order.id)}
                className="mt-1 rounded border-card-border accent-accent shrink-0"
              />
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => setSelectedId(order.id)}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium truncate">
                    {order.buyerName}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[order.status]}`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-muted truncate">
                  {order.buyerEmail}
                </p>
                <div className="flex items-center gap-3 mt-2 text-sm">
                  <span className="text-muted">
                    {order.tier.name}
                  </span>
                  <span className="text-muted">×{order.quantity}</span>
                  <span className="font-medium ml-auto">
                    {formatArs(order.totalArs)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted">
                    {formatDateShort(order.createdAt)}
                  </span>
                  {order.tickets.length > 0 && (
                    <div className="flex gap-1">
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
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedId && (
        <OrderDrawer
          orderId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
