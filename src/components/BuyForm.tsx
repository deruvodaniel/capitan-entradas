"use client";

import { useState } from "react";
import { formatArs } from "@/lib/utils";

interface Tier {
  id: string;
  name: string;
  priceArs: number;
  capacity: number;
  soldCount: number;
}

interface BuyFormProps {
  showId: string;
  tiers: Tier[];
}

export default function BuyForm({ showId, tiers }: BuyFormProps) {
  const [selectedTierId, setSelectedTierId] = useState(tiers[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dni, setDni] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedTier = tiers.find((t) => t.id === selectedTierId);
  const remaining = selectedTier
    ? selectedTier.capacity - selectedTier.soldCount
    : 0;
  const total = selectedTier ? selectedTier.priceArs * quantity : 0;

  // Check for promo: 2x15000 — if tier is "Anticipada" and qty >= 2, apply promo
  const promoTier = tiers.find(
    (t) => t.name.toLowerCase().includes("promo")
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showId,
          tierId: selectedTierId,
          quantity,
          buyerName: name,
          buyerEmail: email,
          buyerDni: dni || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al procesar");
        return;
      }

      window.location.href = data.initPoint;
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tier selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted">Tipo de entrada</label>
        <div className="grid gap-2">
          {tiers.map((tier) => {
            const avail = tier.capacity - tier.soldCount;
            const soldOut = avail <= 0;
            return (
              <button
                key={tier.id}
                type="button"
                disabled={soldOut}
                onClick={() => {
                  setSelectedTierId(tier.id);
                  if (quantity > avail) setQuantity(Math.max(1, avail));
                }}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedTierId === tier.id
                    ? "border-accent bg-accent/10"
                    : "border-card-border bg-card hover:border-muted"
                } ${soldOut ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{tier.name}</span>
                    {soldOut && (
                      <span className="ml-2 text-xs text-red-500">AGOTADO</span>
                    )}
                  </div>
                  <span className="font-bold text-accent">
                    {formatArs(tier.priceArs)}
                  </span>
                </div>
                {!soldOut && (
                  <p className="text-xs text-muted mt-1">
                    {avail} disponible{avail !== 1 ? "s" : ""}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label className="text-sm font-medium text-muted">Cantidad</label>
        <div className="flex items-center gap-3 mt-1">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 rounded-lg border border-card-border bg-card flex items-center justify-center hover:border-muted"
          >
            -
          </button>
          <span className="text-xl font-bold w-8 text-center">{quantity}</span>
          <button
            type="button"
            onClick={() =>
              setQuantity(Math.min(10, remaining, quantity + 1))
            }
            className="w-10 h-10 rounded-lg border border-card-border bg-card flex items-center justify-center hover:border-muted"
          >
            +
          </button>
        </div>
      </div>

      {/* Buyer info */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-muted">Nombre completo</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full px-4 py-3 bg-card border border-card-border rounded-lg focus:outline-none focus:border-accent"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full px-4 py-3 bg-card border border-card-border rounded-lg focus:outline-none focus:border-accent"
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted">DNI (opcional)</label>
          <input
            type="text"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            className="mt-1 w-full px-4 py-3 bg-card border border-card-border rounded-lg focus:outline-none focus:border-accent"
            placeholder="12345678"
          />
        </div>
      </div>

      {/* Total + promo hint */}
      {promoTier && selectedTierId !== promoTier.id && quantity >= 2 && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-sm">
          💡 Tip: Elegí <strong>{promoTier.name}</strong> para{" "}
          {formatArs(promoTier.priceArs)} por entrada
        </div>
      )}

      <div className="flex items-center justify-between py-3 border-t border-card-border">
        <span className="text-muted">Total</span>
        <span className="text-2xl font-bold">{formatArs(total)}</span>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !selectedTier || remaining <= 0}
        className="w-full py-4 bg-accent hover:bg-accent-hover text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
      >
        {loading ? "Procesando..." : `Comprar ${formatArs(total)}`}
      </button>

      <p className="text-xs text-muted text-center">
        Serás redirigido a Mercado Pago para completar el pago
      </p>
    </form>
  );
}
