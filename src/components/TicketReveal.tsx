"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Download } from "lucide-react";

interface TicketData {
  code: string;
  qrDataUrl: string;
  url: string;
}

export default function TicketReveal({ orderId }: { orderId: string }) {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 15; // ~30 seconds

    async function poll() {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/orders/${orderId}/tickets`);
        if (res.ok) {
          const data = await res.json();
          if (data.tickets && data.tickets.length > 0) {
            if (!cancelled) {
              setTickets(data.tickets);
              setLoading(false);
            }
            return;
          }
        }
      } catch {
        /* retry */
      }

      attempts++;
      if (attempts < maxAttempts && !cancelled) {
        setTimeout(poll, 2000);
      } else if (!cancelled) {
        setLoading(false);
      }
    }

    poll();
    return () => { cancelled = true; };
  }, [orderId]);

  function copyLink(url: string, code: string) {
    navigator.clipboard.writeText(url);
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted text-sm">Generando tu entrada...</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted text-sm">
          Tu pago fue procesado. Vas a recibir la entrada por email en unos
          minutos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {tickets.map((ticket, i) => (
        <div
          key={ticket.code}
          className="bg-card border border-card-border rounded-2xl overflow-hidden"
        >
          {/* QR */}
          <div className="flex flex-col items-center px-6 py-6">
            <img
              src={ticket.qrDataUrl}
              alt={`QR ${ticket.code}`}
              className="w-56 h-56 rounded-lg bg-white p-1"
            />
            <p className="mt-3 font-mono text-sm text-muted">{ticket.code}</p>
            {tickets.length > 1 && (
              <p className="text-xs text-muted mt-1">
                Entrada {i + 1} de {tickets.length}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 pb-5 flex gap-2">
            <button
              onClick={() => copyLink(ticket.url, ticket.code)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-background border border-card-border rounded-lg hover:border-muted transition-colors"
            >
              {copied === ticket.code ? (
                <>
                  <Check className="w-4 h-4 text-green-400" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copiar link
                </>
              )}
            </button>
            <a
              href={ticket.qrDataUrl}
              download={`entrada-${ticket.code}.png`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-background border border-card-border rounded-lg hover:border-muted transition-colors"
            >
              <Download className="w-4 h-4" /> Guardar
            </a>
          </div>
        </div>
      ))}

      <p className="text-xs text-muted text-center">
        Presenta el QR en la puerta. No lo compartas.
      </p>
    </div>
  );
}
