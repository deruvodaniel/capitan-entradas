import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { generateQrDataUrl } from "@/lib/tickets/qr";
import { Calendar, MapPin, Ticket } from "lucide-react";
import Footer from "@/components/Footer";
import { getMapsUrl } from "@/lib/utils";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { code },
    include: {
      order: {
        include: { show: true, tier: true },
      },
    },
  });

  if (!ticket || ticket.order.status !== "PAID") {
    notFound();
  }

  const qrDataUrl = await generateQrDataUrl(ticket.qrToken);
  const mapsUrl = getMapsUrl({ mapUrl: ticket.order.show.mapUrl });

  return (
    <main className="flex-1 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-sm w-full">
          <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-accent px-6 py-4 text-center">
              <img
                src="/logo.png"
                alt="CAPITAN"
                className="h-12 mx-auto mb-1"
              />
              <p className="text-white/80 text-sm">Entrada digital</p>
            </div>

            {/* Show info */}
            <div className="px-6 py-4 border-b border-card-border">
              <h2 className="font-bold text-lg">{ticket.order.show.title}</h2>
              <div className="mt-2 space-y-1 text-sm text-muted">
                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(ticket.order.show.startsAt)}
                </p>
                {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-accent hover:underline"
                >
                  <MapPin className="w-4 h-4" />
                  {ticket.order.show.venue}
                  {ticket.order.show.address && ` — ${ticket.order.show.address}`}
                </a>
              ) : (
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {ticket.order.show.venue}
                </p>
              )}
                <p className="flex items-center gap-2">
                  <Ticket className="w-4 h-4" />
                  {ticket.order.tier.name}
                </p>
              </div>
            </div>

            {/* QR */}
            <div className="px-6 py-6 flex flex-col items-center">
              {ticket.status === "VOIDED" ? (
                <div className="text-center py-8">
                  <p className="text-red-500 font-bold">ENTRADA ANULADA</p>
                </div>
              ) : ticket.status === "CHECKED_IN" ? (
                <div className="text-center py-8">
                  <p className="text-yellow-500 font-bold">YA UTILIZADA</p>
                  <p className="text-xs text-muted mt-1">
                    Check-in:{" "}
                    {ticket.checkedInAt ? formatDate(ticket.checkedInAt) : ""}
                  </p>
                </div>
              ) : (
                <>
                  <img
                    src={qrDataUrl}
                    alt="QR de entrada"
                    className="w-56 h-56 rounded-lg"
                  />
                  <p className="mt-3 font-mono text-sm text-muted">
                    {ticket.code}
                  </p>
                </>
              )}
            </div>

            {/* Buyer */}
            <div className="px-6 py-4 border-t border-card-border bg-background/50">
              <p className="text-sm">
                <span className="text-muted">Titular:</span>{" "}
                <span className="font-medium">{ticket.order.buyerName}</span>
              </p>
            </div>
          </div>

          <p className="text-xs text-muted text-center mt-4">
            Presentá este QR en la puerta. No lo compartas.
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}
