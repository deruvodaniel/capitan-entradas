import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Calendar, MapPin, ArrowLeft, Clock } from "lucide-react";
import BuyForm from "@/components/BuyForm";
import Footer from "@/components/Footer";
import { getMapsUrl } from "@/lib/utils";

export default async function ShowPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const show = await prisma.show.findUnique({
    where: { slug },
    include: {
      tiers: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!show || !show.isPublished) {
    notFound();
  }

  const isPast = show.startsAt < new Date();
  const mapsUrl = getMapsUrl({ mapUrl: show.mapUrl });

  return (
    <main className="flex-1">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>

        {show.coverImageUrl && (
          <img
            src={show.coverImageUrl}
            alt={show.title}
            className="w-full h-56 object-cover rounded-xl mb-6"
          />
        )}

        <h1 className="text-3xl font-bold">{show.title}</h1>

        <div className="mt-4 space-y-2 text-muted">
          <p className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatDate(show.startsAt)}
          </p>
          {show.doorsAt && (
            <p className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Puertas: {formatDate(show.doorsAt)}
            </p>
          )}
          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-accent transition-colors group"
            >
              <MapPin className="w-4 h-4 group-hover:text-accent" />
              <span>
                {show.venue}
                {show.address && ` — ${show.address}`}
              </span>
              <span className="text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                Ver en Maps →
              </span>
            </a>
          ) : (
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {show.venue}
            </p>
          )}
        </div>

        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-xs text-accent border border-accent/30 bg-accent/10 hover:bg-accent/20 rounded-lg px-3 py-1.5 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            Ver ubicación en Google Maps
          </a>
        )}

        {show.description && (
          <p className="mt-4 text-sm text-muted leading-relaxed whitespace-pre-line">
            {show.description}
          </p>
        )}

        <div className="mt-8">
          {isPast ? (
            <div className="text-center py-8 bg-card border border-card-border rounded-xl">
              <p className="text-muted">Este show ya pasó.</p>
            </div>
          ) : show.tiers.length === 0 ? (
            <div className="text-center py-8 bg-card border border-card-border rounded-xl">
              <p className="text-muted">
                No hay entradas disponibles por ahora.
              </p>
            </div>
          ) : (
            <BuyForm showId={show.id} tiers={show.tiers} />
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
