"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

interface Props {
  token: string;
  quantity: number;
}

export default function InviteClaimForm({ token, quantity }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/invites/${token}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al procesar la invitación");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="bg-card border border-green-500/30 rounded-xl p-6 text-center space-y-3">
        <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
        <h3 className="font-bold text-lg">¡Listo!</h3>
        <p className="text-sm text-muted">
          {quantity === 1
            ? "Tu entrada fue enviada a"
            : `Tus ${quantity} entradas fueron enviadas a`}{" "}
          <span className="text-foreground font-medium">{email}</span>.
        </p>
        <p className="text-xs text-muted">
          Revisá tu bandeja de entrada (y spam). La entrada tiene un código QR
          que vas a necesitar en la puerta.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <h3 className="text-sm font-semibold mb-4">Completá tus datos</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs text-muted mb-1 block">
            Nombre completo *
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            className="w-full px-3 py-2.5 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">Email *</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full px-3 py-2.5 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent"
          />
          <p className="text-[11px] text-muted/60 mt-1">
            Acá vas a recibir{" "}
            {quantity === 1 ? "tu entrada" : `tus ${quantity} entradas`} con el
            código QR.
          </p>
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">
            Teléfono (opcional)
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+54 9 11 ..."
            className="w-full px-3 py-2.5 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent"
          />
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Procesando...
            </>
          ) : (
            `Reclamar ${quantity === 1 ? "mi entrada" : `mis ${quantity} entradas`}`
          )}
        </button>
      </form>
    </div>
  );
}
