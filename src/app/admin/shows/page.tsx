import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatArs } from "@/lib/utils";
import { Plus, Eye, EyeOff } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function AdminShowsPage() {
  const shows = await prisma.show.findMany({
    include: {
      tiers: { orderBy: { sortOrder: "asc" } },
      _count: { select: { orders: { where: { status: "PAID" } } } },
    },
    orderBy: { startsAt: "desc" },
  });

  async function togglePublish(formData: FormData) {
    "use server";
    const showId = formData.get("showId") as string;
    const current = formData.get("isPublished") === "true";
    await prisma.show.update({
      where: { id: showId },
      data: { isPublished: !current },
    });
    revalidatePath("/admin/shows");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Shows</h1>
        <Link
          href="/admin/shows/new"
          className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-hover"
        >
          <Plus className="w-4 h-4" /> Nuevo show
        </Link>
      </div>

      {shows.length === 0 ? (
        <p className="text-muted text-center py-12">
          No hay shows creados. Creá el primero.
        </p>
      ) : (
        <div className="space-y-4">
          {shows.map((show) => {
            const totalSold = show.tiers.reduce((s, t) => s + t.soldCount, 0);
            const totalCapacity = show.tiers.reduce(
              (s, t) => s + t.capacity,
              0
            );
            const totalRevenue = show.tiers.reduce(
              (s, t) => s + t.soldCount * t.priceArs,
              0
            );

            return (
              <div
                key={show.id}
                className="bg-card border border-card-border rounded-xl p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-lg">{show.title}</h2>
                      {show.isPublished ? (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                          Publicado
                        </span>
                      ) : (
                        <span className="text-xs bg-muted/20 text-muted px-2 py-0.5 rounded-full">
                          Borrador
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted mt-1">
                      {formatDate(show.startsAt)} — {show.venue}
                    </p>
                  </div>
                  <form action={togglePublish}>
                    <input type="hidden" name="showId" value={show.id} />
                    <input
                      type="hidden"
                      name="isPublished"
                      value={String(show.isPublished)}
                    />
                    <button
                      type="submit"
                      className="flex items-center gap-1 text-sm text-muted hover:text-foreground border border-card-border px-3 py-1.5 rounded-lg"
                    >
                      {show.isPublished ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Publicar
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-background rounded-lg p-3">
                    <p className="text-muted">Vendidas</p>
                    <p className="text-xl font-bold">
                      {totalSold}
                      <span className="text-sm text-muted font-normal">
                        /{totalCapacity}
                      </span>
                    </p>
                  </div>
                  <div className="bg-background rounded-lg p-3">
                    <p className="text-muted">Recaudado</p>
                    <p className="text-xl font-bold">
                      {formatArs(totalRevenue)}
                    </p>
                  </div>
                  <div className="bg-background rounded-lg p-3">
                    <p className="text-muted">Órdenes pagas</p>
                    <p className="text-xl font-bold">{show._count.orders}</p>
                  </div>
                </div>

                {/* Tiers */}
                <div className="mt-4">
                  <p className="text-xs text-muted mb-2">Tiers:</p>
                  <div className="flex flex-wrap gap-2">
                    {show.tiers.map((tier) => (
                      <span
                        key={tier.id}
                        className="text-xs bg-background border border-card-border px-3 py-1 rounded-full"
                      >
                        {tier.name}: {formatArs(tier.priceArs)} ({tier.soldCount}
                        /{tier.capacity})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/show/${show.slug}`}
                    target="_blank"
                    className="text-xs text-accent hover:underline"
                  >
                    Ver página pública →
                  </Link>
                  <Link
                    href={`/admin/shows/${show.id}/edit`}
                    className="text-xs text-muted hover:text-foreground"
                  >
                    Editar
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
