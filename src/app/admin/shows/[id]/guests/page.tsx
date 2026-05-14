"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus, Trash2, CheckCircle, Clock, Users } from "lucide-react";
import { formatDateShort } from "@/lib/utils";

interface GuestTicket {
  id: string;
  status: "VALID" | "CHECKED_IN" | "VOIDED";
  checkedInAt: string | null;
}

interface Guest {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  quantity: number;
  createdAt: string;
  tickets: GuestTicket[];
}

export default function GuestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [showId, setShowId] = useState<string | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companions, setCompanions] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    params.then(({ id }) => {
      setShowId(id);
      fetchGuests(id);
    });
  }, [params]);

  async function fetchGuests(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/shows/${id}/guests`);
      const data = await res.json();
      setGuests(Array.isArray(data) ? data : []);
    } catch {
      setGuests([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!showId) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/shows/${showId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: name,
          guestEmail: email,
          guestPhone: phone || undefined,
          companions,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al agregar invitado");
        return;
      }

      setSuccess(
        `✓ ${name} agregado. ${1 + companions} entrada${1 + companions > 1 ? "s" : ""} enviada${1 + companions > 1 ? "s" : ""} por email.`
      );
      setName("");
      setEmail("");
      setPhone("");
      setCompanions(0);
      setNotes("");
      startTransition(() => fetchGuests(showId));
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(orderId: string, guestName: string) {
    if (!showId) return;
    if (!confirm(`¿Eliminar a ${guestName} de la lista de invitados?`)) return;

    const res = await fetch(
      `/api/admin/shows/${showId}/guests?orderId=${orderId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      startTransition(() => fetchGuests(showId));
    }
  }

  const checkedIn = guests.filter((g) =>
    g.tickets.some((t) => t.status === "CHECKED_IN")
  ).length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/shows"
          className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-card/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Lista de Invitados
          </h1>
          {guests.length > 0 && (
            <p className="text-xs text-muted mt-0.5">
              {guests.length} invitado{guests.length !== 1 ? "s" : ""} —{" "}
              {checkedIn} ingresado{checkedIn !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Add guest form */}
      <div className="bg-card border border-card-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-accent" />
          Agregar invitado
        </h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted mb-1 block">Nombre completo *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan García"
                className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Email *</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@email.com"
                className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted mb-1 block">Teléfono (opcional)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 9 11 ..."
                className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">
                Acompañantes
                <span className="ml-1 text-muted/60">
                  (= {1 + companions} entrada{1 + companions > 1 ? "s" : ""})
                </span>
              </label>
              <select
                value={companions}
                onChange={(e) => setCompanions(Number(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent"
              >
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n === 0 ? "Solo (sin acompañantes)" : `+${n} acompañante${n > 1 ? "s" : ""}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted mb-1 block">Notas (opcional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ganó sorteo de Instagram"
              className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {submitting
              ? "Agregando y enviando entrada..."
              : `Agregar + enviar ${1 + companions} entrada${1 + companions > 1 ? "s" : ""} por email`}
          </button>
        </form>
      </div>

      {/* Guest list */}
      {loading ? (
        <p className="text-muted text-sm text-center py-8">Cargando...</p>
      ) : guests.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay invitados todavía.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {guests.map((guest) => {
            const checkedInCount = guest.tickets.filter(
              (t) => t.status === "CHECKED_IN"
            ).length;
            const allIn = checkedInCount === guest.tickets.length && guest.tickets.length > 0;

            return (
              <div
                key={guest.id}
                className={`bg-card border rounded-xl p-4 flex items-start gap-4 ${
                  allIn ? "border-green-500/30" : "border-card-border"
                }`}
              >
                {/* Status icon */}
                <div className="mt-0.5 shrink-0">
                  {allIn ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-muted/50" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{guest.buyerName}</p>
                      <p className="text-xs text-muted">{guest.buyerEmail}</p>
                      {guest.buyerPhone && (
                        <p className="text-xs text-muted">{guest.buyerPhone}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(guest.id, guest.buyerName)}
                      className="p-1.5 text-muted hover:text-red-400 transition-colors shrink-0"
                      title="Eliminar invitado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-accent font-medium">
                      {guest.quantity} entrada{guest.quantity > 1 ? "s" : ""}
                    </span>

                    {/* Ticket status badges */}
                    {guest.tickets.map((t) => (
                      <span
                        key={t.id}
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          t.status === "CHECKED_IN"
                            ? "bg-green-500/20 text-green-400"
                            : t.status === "VOIDED"
                              ? "bg-red-500/20 text-red-400 line-through"
                              : "bg-muted/20 text-muted"
                        }`}
                      >
                        {t.status === "CHECKED_IN"
                          ? "✓ Ingresó"
                          : t.status === "VOIDED"
                            ? "Anulado"
                            : "Pendiente"}
                      </span>
                    ))}

                    <span className="text-xs text-muted ml-auto">
                      {formatDateShort(guest.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
