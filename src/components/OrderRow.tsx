"use client";

import { formatArs, formatDateShort } from "@/lib/utils";

type Status = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "REFUNDED";

interface OrderRowProps {
  order: {
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
  };
  onClick: () => void;
}

const STATUS_COLORS: Record<Status, string> = {
  PAID: "text-green-400 bg-green-500/20",
  PENDING: "text-yellow-400 bg-yellow-500/20",
  FAILED: "text-red-400 bg-red-500/20",
  EXPIRED: "text-muted bg-muted/20",
  REFUNDED: "text-orange-400 bg-orange-500/20",
};

export default function OrderRow({ order, onClick }: OrderRowProps) {
  return (
    <tr
      onClick={onClick}
      className="border-b border-card-border/50 hover:bg-card/50 cursor-pointer transition-colors"
    >
      <td className="py-3 text-muted whitespace-nowrap">
        {formatDateShort(order.createdAt)}
      </td>
      <td className="py-3">{order.show.title}</td>
      <td className="py-3">
        <div>{order.buyerName}</div>
        <div className="text-xs text-muted">{order.buyerEmail}</div>
      </td>
      <td className="py-3">{order.tier.name}</td>
      <td className="py-3 text-center">{order.quantity}</td>
      <td className="py-3 font-medium">{formatArs(order.totalArs)}</td>
      <td className="py-3">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}
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
  );
}
