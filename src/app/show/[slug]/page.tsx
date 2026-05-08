import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Calendar, MapPin, ArrowLeft, Clock } from "lucide-react";
import BuyForm from "@/components/BuyForm";
import Footer from "@/components/Footer";

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
          <p className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {show.venue}
            {show.address && ` — ${show.address}`}
          </p>
        </div>

        {show.description && (
          <p className="mt-4 text-sm text-muted leading-relaxed">
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
