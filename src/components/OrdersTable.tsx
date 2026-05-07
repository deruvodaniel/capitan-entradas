"use client";

import { useState } from "react";
import OrderRow from "./OrderRow";
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

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-card-border">
              <th className="pb-3 font-medium">Fecha</th>
              <th className="pb-3 font-medium">Show</th>
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
              <OrderRow
                key={order.id}
                order={order}
                onClick={() => setSelectedId(order.id)}
              />
            ))}
          </tbody>
        </table>
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
