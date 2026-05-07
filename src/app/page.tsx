import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatArs, formatDate } from "@/lib/utils";
import { Calendar, MapPin, Music } from "lucide-react";

export default async function HomePage() {
  const shows = await prisma.show.findMany({
    where: { isPublished: true, startsAt: { gte: new Date() } },
    include: {
      tiers: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  return (
    <main className="flex-1">
      <header className="border-b border-card-border">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <img
            src="/logo.png"
            alt="CAPITAN"
            className="h-16 mx-auto mb-2"
          />
          <h1 className="text-4xl font-bold tracking-wider">CAPITAN</h1>
          <p className="text-muted mt-2">🎸 Rock en vivo</p>
        </div>
      </header>

      <section className="max-w-2xl mx-auto px-4 py-8">
        {shows.length === 0 ? (
          <div className="text-center py-16">
            <Music className="w-12 h-12 mx-auto text-muted mb-4" />
            <p className="text-muted text-lg">
              No hay shows programados por ahora.
            </p>
            <p className="text-muted text-sm mt-2">
              Seguinos en{" "}
              <a
                href="https://linktr.ee/rockcapitan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                nuestras redes
              </a>{" "}
              para enterarte primero.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {shows.map((show) => {
              const minPrice = Math.min(
                ...show.tiers.map((t) => t.priceArs)
              );
              const totalCapacity = show.tiers.reduce(
                (sum, t) => sum + t.capacity,
                0
              );
              const totalSold = show.tiers.reduce(
                (sum, t) => sum + t.soldCount,
                0
              );
              const soldOut = totalSold >= totalCapacity;

              return (
                <Link
                  key={show.id}
                  href={`/show/${show.slug}`}
                  className="block bg-card border border-card-border rounded-xl p-6 hover:border-accent/50 transition-colors"
                >
                  {show.coverImageUrl && (
                    <img
                      src={show.coverImageUrl}
                      alt={show.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h2 className="text-xl font-bold">{show.title}</h2>
                  <div className="mt-3 space-y-1 text-sm text-muted">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(show.startsAt)}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {show.venue}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    {soldOut ? (
                      <span className="text-sm font-medium text-red-500">
                        AGOTADO
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-accent">
                        Desde {formatArs(minPrice)}
                      </span>
                    )}
                    <span className="text-xs bg-accent text-white px-3 py-1 rounded-full font-medium">
                      Comprar
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <footer className="border-t border-card-border mt-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 text-center text-sm text-muted">
          <p>CAPITAN 🤘</p>
          <a
            href="https://linktr.ee/rockcapitan"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            linktr.ee/rockcapitan
          </a>
        </div>
      </footer>
    </main>
  );
}
