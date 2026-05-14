"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  CheckCircle,
  Clock,
  Users,
  LinkIcon,
  Copy,
  Check,
  Send,
} from "lucide-react";
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

interface Invite {
  id: string;
  token: string;
  quantity: number;
  label: string | null;
  status: "PENDING" | "CLAIMED" | "EXPIRED";
  claimedAt: string | null;
  createdAt: string;
}

export default function GuestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [showId, setShowId] = useState<string | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  // Manual add form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companions, setCompanions] = useState(0);
  const [notes, setNotes] = useState("");

  // Invite link form state
  const [inviteQty, setInviteQty] = useState(1);
  const [inviteLabel, setInviteLabel] = useState("");
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Tab: "manual" or "link"
  const [tab, setTab] = useState<"link" | "manual">("link");

  useEffect(() => {
    params.then(({ id }) => {
      setShowId(id);
      fetchAll(id);
    });
  }, [params]);

  async function fetchAll(id: string) {
    setLoading(true);
    try {
      const [guestsRes, invitesRes] = await Promise.all([
        fetch(`/api/admin/shows/${id}/guests`),
        fetch(`/api/admin/shows/${id}/invites`),
      ]);
      const guestsData = await guestsRes.json();
      const invitesData = await invitesRes.json();
      setGuests(Array.isArray(guestsData) ? guestsData : []);
      setInvites(Array.isArray(invitesData) ? invitesData : []);
    } catch {
      setGuests([]);
      setInvites([]);
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
        `${name} agregado. ${1 + companions} entrada${1 + companions > 1 ? "s" : ""} enviada${1 + companions > 1 ? "s" : ""} por email.`
      );
      setName("");
      setEmail("");
      setPhone("");
      setCompanions(0);
      setNotes("");
      startTransition(() => fetchAll(showId));
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!showId) return;
    setError("");
    setSuccess("");
    setCreatingInvite(true);

    try {
      const res = await fetch(`/api/admin/shows/${showId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: inviteQty,
          label: inviteLabel || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear invitación");
        return;
      }

      // Copy link to clipboard
      const link = `${window.location.origin}/invite/${data.token}`;
      await navigator.clipboard.writeText(link);
      setCopiedToken(data.token);
      setTimeout(() => setCopiedToken(null), 3000);

      setSuccess(`Link de invitación creado y copiado al portapapeles.`);
      setInviteLabel("");
      setInviteQty(1);
      startTransition(() => fetchAll(showId));
    } catch {
      setError("Error de conexión");
    } finally {
      setCreatingInvite(false);
    }
  }

  async function handleDeleteInvite(inviteId: string) {
    if (!showId) return;
    if (!confirm("¿Eliminar esta invitación?")) return;

    await fetch(`/api/admin/shows/${showId}/invites?inviteId=${inviteId}`, {
      method: "DELETE",
    });
    startTransition(() => fetchAll(showId));
  }

  async function handleDeleteGuest(orderId: string, guestName: string) {
    if (!showId) return;
    if (!confirm(`¿Eliminar a ${guestName} de la lista de invitados?`)) return;

    const res = await fetch(
      `/api/admin/shows/${showId}/guests?orderId=${orderId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      startTransition(() => fetchAll(showId));
    }
  }

  async function copyInviteLink(token: string) {
    const link = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 3000);
  }

  const checkedIn = guests.filter((g) =>
    g.tickets.some((t) => t.status === "CHECKED_IN")
  ).length;

  const pendingInvites = invites.filter((i) => i.status === "PENDING");
  const claimedInvites = invites.filter((i) => i.status === "CLAIMED");

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
          <p className="text-xs text-muted mt-0.5">
            {guests.length > 0 && (
              <>
                {guests.length} invitado{guests.length !== 1 ? "s" : ""} —{" "}
                {checkedIn} ingresado{checkedIn !== 1 ? "s" : ""}
              </>
            )}
            {pendingInvites.length > 0 && (
              <>
                {guests.length > 0 && " · "}
                {pendingInvites.length} link{pendingInvites.length !== 1 ? "s" : ""} pendiente{pendingInvites.length !== 1 ? "s" : ""}
              </>
            )}
            {guests.length === 0 && pendingInvites.length === 0 && !loading && "Sin invitados todavía"}
          </p>
        </div>
      </div>

      {/* Tabs: Link / Manual */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => { setTab("link"); setError(""); setSuccess(""); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "link"
              ? "bg-accent/20 text-accent"
              : "text-muted hover:text-foreground hover:bg-card"
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          Crear link de invitación
        </button>
        <button
          onClick={() => { setTab("manual"); setError(""); setSuccess(""); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "manual"
              ? "bg-accent/20 text-accent"
              : "text-muted hover:text-foreground hover:bg-card"
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Agregar manualmente
        </button>
      </div>

      {/* Link invite form */}
      {tab === "link" && (
        <div className="bg-card border border-card-border rounded-xl p-5 mb-6">
          <p className="text-xs text-muted mb-4">
            Creá un link para que el invitado complete sus datos y reciba la
            entrada automáticamente por email.
          </p>
          <form onSubmit={handleCreateInvite} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1 block">
                  Cantidad de entradas
                </label>
                <select
                  value={inviteQty}
                  onChange={(e) => setInviteQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>
                      {n} entrada{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">
                  Etiqueta (opcional)
                </label>
                <input
                  value={inviteLabel}
                  onChange={(e) => setInviteLabel(e.target.value)}
                  placeholder="Ganó sorteo IG"
                  className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {error && tab === "link" && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            {success && tab === "link" && (
              <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={creatingInvite}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LinkIcon className="w-4 h-4" />
              {creatingInvite
                ? "Creando..."
                : "Crear link y copiar al portapapeles"}
            </button>
          </form>
        </div>
      )}

      {/* Manual add form */}
      {tab === "manual" && (
        <div className="bg-card border border-card-border rounded-xl p-5 mb-6">
          <p className="text-xs text-muted mb-4">
            Agregá un invitado directamente. Se genera la entrada y se envía por
            email al instante.
          </p>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted mb-1 block">
                  Nombre completo *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan García"
                  className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">
                  Email *
                </label>
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
                <label className="text-xs text-muted mb-1 block">
                  Teléfono (opcional)
                </label>
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
                      {n === 0
                        ? "Solo (sin acompañantes)"
                        : `+${n} acompañante${n > 1 ? "s" : ""}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted mb-1 block">
                Notas (opcional)
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ganó sorteo de Instagram"
                className="w-full px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent"
              />
            </div>

            {error && tab === "manual" && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            {success && tab === "manual" && (
              <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting
                ? "Agregando y enviando entrada..."
                : `Agregar + enviar ${1 + companions} entrada${1 + companions > 1 ? "s" : ""} por email`}
            </button>
          </form>
        </div>
      )}

      {/* Pending invite links */}
      {pendingInvites.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted mb-3 flex items-center gap-2">
            <LinkIcon className="w-3.5 h-3.5" />
            Links pendientes ({pendingInvites.length})
          </h2>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <div
                key={inv.id}
                className="bg-card border border-card-border rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {inv.quantity} entrada{inv.quantity > 1 ? "s" : ""}
                    </span>
                    {inv.label && (
                      <span className="text-xs text-muted bg-muted/10 rounded px-1.5 py-0.5">
                        {inv.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted truncate mt-0.5">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/invite/${inv.token}`
                      : `/invite/${inv.token}`}
                  </p>
                </div>
                <button
                  onClick={() => copyInviteLink(inv.token)}
                  className="p-2 text-muted hover:text-accent transition-colors shrink-0"
                  title="Copiar link"
                >
                  {copiedToken === inv.token ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDeleteInvite(inv.id)}
                  className="p-2 text-muted hover:text-red-400 transition-colors shrink-0"
                  title="Eliminar invitación"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claimed invites (collapsed info) */}
      {claimedInvites.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted mb-3 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            Links reclamados ({claimedInvites.length})
          </h2>
          <div className="space-y-2">
            {claimedInvites.map((inv) => (
              <div
                key={inv.id}
                className="bg-card border border-green-500/20 rounded-xl px-4 py-3 flex items-center gap-3 opacity-70"
              >
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {inv.quantity} entrada{inv.quantity > 1 ? "s" : ""}
                    </span>
                    {inv.label && (
                      <span className="text-xs text-muted bg-muted/10 rounded px-1.5 py-0.5">
                        {inv.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Reclamado{" "}
                    {inv.claimedAt ? formatDateShort(inv.claimedAt) : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guest list (fulfilled orders) */}
      {loading ? (
        <p className="text-muted text-sm text-center py-8">Cargando...</p>
      ) : guests.length === 0 && invites.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay invitados todavía.</p>
          <p className="text-xs mt-1">
            Creá un link de invitación o agregá uno manualmente.
          </p>
        </div>
      ) : guests.length > 0 ? (
        <>
          <h2 className="text-sm font-semibold text-muted mb-3 flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            Invitados confirmados ({guests.length})
          </h2>
          <div className="space-y-3">
            {guests.map((guest) => {
              const checkedInCount = guest.tickets.filter(
                (t) => t.status === "CHECKED_IN"
              ).length;
              const allIn =
                checkedInCount === guest.tickets.length &&
                guest.tickets.length > 0;

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
                        <p className="font-medium text-sm">
                          {guest.buyerName}
                        </p>
                        <p className="text-xs text-muted">{guest.buyerEmail}</p>
                        {guest.buyerPhone && (
                          <p className="text-xs text-muted">
                            {guest.buyerPhone}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          handleDeleteGuest(guest.id, guest.buyerName)
                        }
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
                            ? "Ingresó"
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
        </>
      ) : null}
    </div>
  );
}
