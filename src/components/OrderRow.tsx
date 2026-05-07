"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatArs, formatDateShort } from "@/lib/utils";
import { Pencil, Trash2, X, Check } from "lucide-react";

type Status = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "REFUNDED";

interface OrderRowProps {
  order: {
    id: string;
    createdAt: Date | string;
    buyerName: string;
    buyerEmail: string;
    buyerDni: string | null;
    quantity: number;
    totalArs: number;
    status: Status;
    show: { title: string };
    tier: { name: string };
    tickets: { code: string; status: string }[];
  };
}

const STATUS_COLORS: Record<Status, string> = {
  PAID: "text-green-400 bg-green-500/20",
  PENDING: "text-yellow-400 bg-yellow-500/20",
  FAILED: "text-red-400 bg-red-500/20",
  EXPIRED: "text-muted bg-muted/20",
  REFUNDED: "text-orange-400 bg-orange-500/20",
};

const STATUS_OPTIONS: Status[] = [
  "PENDING",
  "PAID",
  "FAILED",
  "EXPIRED",
  "REFUNDED",
];

export default function OrderRow({ order }: OrderRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(order.buyerName);
  const [email, setEmail] = useState(order.buyerEmail);
  const [dni, setDni] = useState(order.buyerDni || "");
  const [status, setStatus] = useState<Status>(order.status);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyerName: name,
        buyerEmail: email,
        buyerDni: dni || null,
        status,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Error al guardar");
      return;
    }
    setEditing(false);
    startTransition(() => router.refresh());
  }

  async function changeStatus(newStatus: Status) {
    if (newStatus === order.status) return;
    const confirmMsg =
      newStatus === "PAID"
        ? "¿Marcar como PAGADA? Se va a sumar al soldCount del tier."
        : order.status === "PAID"
          ? "¿Cambiar estado de PAGADA? Se va a restar del soldCount y los tickets quedan VOIDED."
          : `¿Cambiar estado a ${newStatus}?`;
    if (!confirm(confirmMsg)) return;
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      alert("Error al cambiar estado");
      return;
    }
    startTransition(() => router.refresh());
  }

  async function remove() {
    if (
      !confirm(
        `¿BORRAR la orden de ${order.buyerName}? Esto elimina la orden y sus entradas. Si estaba PAGADA, libera el cupo.`
      )
    )
      return;
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      alert("Error al borrar");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <tr className="border-b border-card-border/50 align-top">
      <td className="py-3 text-muted whitespace-nowrap">
        {formatDateShort(order.createdAt)}
      </td>
      <td className="py-3">{order.show.title}</td>
      <td className="py-3">
        {editing ? (
          <div className="space-y-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-2 py-1 bg-card border border-card-border rounded text-sm"
              placeholder="Nombre"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-2 py-1 bg-card border border-card-border rounded text-sm"
              placeholder="Email"
            />
            <input
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              className="w-full px-2 py-1 bg-card border border-card-border rounded text-sm"
              placeholder="DNI"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
          </div>
        ) : (
          <div>
            <div>{order.buyerName}</div>
            <div className="text-xs text-muted">{order.buyerEmail}</div>
            {order.buyerDni && (
              <div className="text-xs text-muted">DNI: {order.buyerDni}</div>
            )}
          </div>
        )}
      </td>
      <td className="py-3">{order.tier.name}</td>
      <td className="py-3">{order.quantity}</td>
      <td className="py-3 font-medium">{formatArs(order.totalArs)}</td>
      <td className="py-3">
        {editing ? (
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="bg-card border border-card-border rounded px-2 py-1 text-xs"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={order.status}
            onChange={(e) => changeStatus(e.target.value as Status)}
            disabled={isPending}
            className={`text-xs px-2 py-0.5 rounded-full font-medium border-0 cursor-pointer ${STATUS_COLORS[order.status]}`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="bg-card text-foreground">
                {s}
              </option>
            ))}
          </select>
        )}
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
      <td className="py-3">
        <div className="flex gap-1">
          {editing ? (
            <>
              <button
                onClick={save}
                disabled={isPending}
                className="p-1.5 rounded hover:bg-green-500/20 text-green-400"
                title="Guardar"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setName(order.buyerName);
                  setEmail(order.buyerEmail);
                  setDni(order.buyerDni || "");
                  setStatus(order.status);
                  setError("");
                }}
                className="p-1.5 rounded hover:bg-muted/20 text-muted"
                title="Cancelar"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded hover:bg-muted/20 text-muted hover:text-foreground"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={remove}
                disabled={isPending}
                className="p-1.5 rounded hover:bg-red-500/20 text-muted hover:text-red-400"
                title="Borrar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
