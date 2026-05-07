"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatArs, formatDateShort, formatDate } from "@/lib/utils";
import {
  X,
  Copy,
  Check,
  Trash2,
  Pencil,
  ExternalLink,
  QrCode,
  AlertTriangle,
} from "lucide-react";

type Status = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "REFUNDED";

interface OrderSummary {
  id: string;
  createdAt: string;
  buyerName: string;
  buyerEmail: string;
  buyerDni: string | null;
  quantity: number;
  unitPriceArs: number;
  totalArs: number;
  status: Status;
  mpPaymentId: string | null;
  mpPreferenceId: string | null;
  mpStatusDetail: string | null;
  paidAt: string | null;
  show: { title: string; venue: string; startsAt: string };
  tier: { name: string };
  tickets: {
    id: string;
    code: string;
    status: string;
    checkedInAt: string | null;
    checkedInBy: string | null;
    url: string;
    qrDataUrl: string | null;
  }[];
}

const STATUS_COLORS: Record<Status, string> = {
  PAID: "text-green-400 bg-green-500/20 border-green-500/30",
  PENDING: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
  FAILED: "text-red-400 bg-red-500/20 border-red-500/30",
  EXPIRED: "text-muted bg-muted/20 border-muted/30",
  REFUNDED: "text-orange-400 bg-orange-500/20 border-orange-500/30",
};

const STATUS_OPTIONS: Status[] = [
  "PENDING",
  "PAID",
  "FAILED",
  "EXPIRED",
  "REFUNDED",
];

export default function OrderDrawer({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dni, setDni] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    type: "status" | "delete";
    value?: Status;
  } | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function fetchOrder() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        setName(data.buyerName);
        setEmail(data.buyerEmail);
        setDni(data.buyerDni || "");
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit() {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyerName: name,
        buyerEmail: email,
        buyerDni: dni || null,
      }),
    });
    if (res.ok) {
      setEditing(false);
      fetchOrder();
      startTransition(() => router.refresh());
    }
  }

  async function changeStatus(newStatus: Status) {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setConfirmAction(null);
      fetchOrder();
      startTransition(() => router.refresh());
    }
  }

  async function deleteOrder() {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      startTransition(() => router.refresh());
      onClose();
    }
  }

  function copyToClipboard(text: string, code: string) {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-background border-l border-card-border z-50 overflow-y-auto animate-in slide-in-from-right">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-card-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-bold text-lg">Detalle de orden</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-card text-muted hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center text-muted">Cargando...</div>
        ) : !order ? (
          <div className="p-6 text-center text-red-400">
            Error al cargar la orden
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Status badge */}
            <div className="flex items-center justify-between">
              <span
                className={`text-sm px-3 py-1 rounded-full font-bold border ${STATUS_COLORS[order.status]}`}
              >
                {order.status}
              </span>
              <span className="text-xs text-muted font-mono">
                {order.id.slice(0, 16)}...
              </span>
            </div>

            {/* Show info */}
            <div className="bg-card border border-card-border rounded-xl p-4 space-y-1">
              <p className="font-bold">{order.show.title}</p>
              <p className="text-sm text-muted">{order.show.venue}</p>
              <p className="text-sm text-muted">
                {formatDate(order.show.startsAt)}
              </p>
              <p className="text-sm">
                {order.tier.name} x {order.quantity}
              </p>
              <p className="text-lg font-bold mt-2">
                {formatArs(order.totalArs)}
              </p>
            </div>

            {/* Buyer info */}
            <div className="bg-card border border-card-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm text-muted">Comprador</h3>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1 rounded hover:bg-muted/20 text-muted hover:text-foreground"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-sm"
                    placeholder="Nombre"
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-sm"
                    placeholder="Email"
                  />
                  <input
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-sm"
                    placeholder="DNI"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={saveEdit}
                      className="px-3 py-1.5 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setName(order.buyerName);
                        setEmail(order.buyerEmail);
                        setDni(order.buyerDni || "");
                      }}
                      className="px-3 py-1.5 text-sm text-muted hover:text-foreground"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{order.buyerName}</p>
                  <p className="text-muted">{order.buyerEmail}</p>
                  {order.buyerDni && (
                    <p className="text-muted">DNI: {order.buyerDni}</p>
                  )}
                </div>
              )}
            </div>

            {/* Payment info */}
            <div className="bg-card border border-card-border rounded-xl p-4 space-y-2">
              <h3 className="font-medium text-sm text-muted mb-3">Pago</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted text-xs">Creada</p>
                  <p>{formatDateShort(order.createdAt)}</p>
                </div>
                {order.paidAt && (
                  <div>
                    <p className="text-muted text-xs">Pagada</p>
                    <p>{formatDateShort(order.paidAt)}</p>
                  </div>
                )}
                {order.mpPaymentId && (
                  <div>
                    <p className="text-muted text-xs">Payment ID</p>
                    <p className="font-mono">{order.mpPaymentId}</p>
                  </div>
                )}
                {order.mpStatusDetail && (
                  <div>
                    <p className="text-muted text-xs">Detalle</p>
                    <p className="font-mono">{order.mpStatusDetail}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tickets / QR */}
            {order.tickets.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted flex items-center gap-2">
                  <QrCode className="w-4 h-4" /> Entradas (
                  {order.tickets.length})
                </h3>
                {order.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-card border border-card-border rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono font-bold">
                        {ticket.code}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          ticket.status === "VALID"
                            ? "text-green-400 bg-green-500/20"
                            : ticket.status === "CHECKED_IN"
                              ? "text-blue-400 bg-blue-500/20"
                              : "text-red-400 bg-red-500/20"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    {ticket.qrDataUrl && (
                      <div className="flex justify-center mb-3">
                        <img
                          src={ticket.qrDataUrl}
                          alt={`QR ${ticket.code}`}
                          className="w-48 h-48 rounded-lg bg-white p-1"
                        />
                      </div>
                    )}

                    {ticket.checkedInAt && (
                      <p className="text-xs text-muted text-center mb-2">
                        Check-in: {formatDateShort(ticket.checkedInAt)}
                        {ticket.checkedInBy && ` por ${ticket.checkedInBy}`}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          copyToClipboard(ticket.url, ticket.code)
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-background border border-card-border rounded-lg hover:border-muted"
                      >
                        {copiedCode === ticket.code ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-400" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copiar link
                          </>
                        )}
                      </button>
                      <a
                        href={ticket.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-background border border-card-border rounded-lg hover:border-muted"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Abrir
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-card-border pt-6 space-y-3">
              <h3 className="font-medium text-sm text-muted">Acciones</h3>

              {/* Status change */}
              {!confirmAction && (
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.filter((s) => s !== order.status).map(
                    (s) => (
                      <button
                        key={s}
                        onClick={() =>
                          setConfirmAction({ type: "status", value: s })
                        }
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80 ${STATUS_COLORS[s]}`}
                      >
                        Marcar {s}
                      </button>
                    )
                  )}
                </div>
              )}

              {/* Confirm status */}
              {confirmAction?.type === "status" && confirmAction.value && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">
                        Cambiar estado a {confirmAction.value}
                      </p>
                      {order.status === "PAID" && (
                        <p className="text-muted mt-1">
                          Se va a liberar el cupo y los tickets quedan VOIDED.
                        </p>
                      )}
                      {confirmAction.value === "PAID" && (
                        <p className="text-muted mt-1">
                          Se va a descontar del cupo disponible del tier.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => changeStatus(confirmAction.value!)}
                      disabled={isPending}
                      className="px-4 py-2 text-sm bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmAction(null)}
                      className="px-4 py-2 text-sm text-muted hover:text-foreground"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Delete */}
              {!confirmAction && (
                <button
                  onClick={() => setConfirmAction({ type: "delete" })}
                  className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 mt-2"
                >
                  <Trash2 className="w-4 h-4" /> Borrar orden
                </button>
              )}

              {confirmAction?.type === "delete" && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm">
                      Se va a eliminar la orden, las entradas, y liberar el cupo
                      si estaba pagada. <strong>No se puede deshacer.</strong>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={deleteOrder}
                      disabled={isPending}
                      className="px-4 py-2 text-sm bg-red-500 text-white font-medium rounded-lg hover:bg-red-400"
                    >
                      Borrar definitivamente
                    </button>
                    <button
                      onClick={() => setConfirmAction(null)}
                      className="px-4 py-2 text-sm text-muted hover:text-foreground"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
