import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import ShowForm from "@/components/ShowForm";
import { toArgDatetimeLocal, parseArgDatetimeLocal } from "@/lib/utils";

export default async function EditShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const show = await prisma.show.findUnique({
    where: { id },
    include: { tiers: { orderBy: { sortOrder: "asc" } } },
  });

  if (!show) notFound();

  // El slug se deriva del título, así que al editar puede cambiar.
  const previousSlug = show.slug;

  async function updateShow(formData: FormData) {
    "use server";

    const title = formData.get("title") as string;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const venue = formData.get("venue") as string;
    const address = (formData.get("address") as string) || null;
    const mapUrl = (formData.get("mapUrl") as string) || null;
    const startsAt = parseArgDatetimeLocal(formData.get("startsAt") as string);
    const doorsAtRaw = formData.get("doorsAt") as string;
    const doorsAt = doorsAtRaw ? parseArgDatetimeLocal(doorsAtRaw) : null;
    const description = (formData.get("description") as string) || null;
    const coverImageUrl = (formData.get("coverImageUrl") as string) || null;

    const tierNames = formData.getAll("tierName") as string[];
    const tierPrices = formData.getAll("tierPrice") as string[];
    const tierCapacities = formData.getAll("tierCapacity") as string[];

    const newTiers = tierNames
      .map((name, i) => ({
        name,
        priceArs: Math.round(parseFloat(tierPrices[i])),
        capacity: parseInt(tierCapacities[i]),
        sortOrder: i,
      }))
      .filter((t) => t.name && t.priceArs > 0 && t.capacity > 0);

    await prisma.$transaction(async (tx) => {
      await tx.show.update({
        where: { id },
        data: {
          title,
          slug,
          venue,
          address,
          mapUrl,
          startsAt,
          doorsAt,
          description,
          coverImageUrl,
        },
      });

      // Get current tiers
      const currentTiers = await tx.ticketTier.findMany({
        where: { showId: id },
      });

      const newTierNames = new Set(newTiers.map((t) => t.name));

      // Handle removed tiers: delete if no sales, deactivate if has sales
      for (const existing of currentTiers) {
        if (!newTierNames.has(existing.name)) {
          if (existing.soldCount === 0) {
            await tx.ticketTier.delete({ where: { id: existing.id } });
          } else {
            await tx.ticketTier.update({
              where: { id: existing.id },
              data: { isActive: false },
            });
          }
        }
      }

      // Upsert tiers from form
      for (const tier of newTiers) {
        const existing = currentTiers.find((t) => t.name === tier.name);
        if (existing) {
          await tx.ticketTier.update({
            where: { id: existing.id },
            data: {
              priceArs: tier.priceArs,
              capacity: tier.capacity,
              sortOrder: tier.sortOrder,
              isActive: true,
            },
          });
        } else {
          await tx.ticketTier.create({
            data: { ...tier, showId: id },
          });
        }
      }
    });

    revalidatePath("/admin/shows");
    // La home lista los shows publicados: sin esto sigue sirviendo la versión cacheada.
    revalidatePath("/");
    revalidatePath(`/show/${slug}`);
    if (previousSlug !== slug) revalidatePath(`/show/${previousSlug}`);
    redirect("/admin/shows");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Editar: {show.title}</h1>
      <ShowForm
        action={updateShow}
        defaultValues={{
          title: show.title,
          venue: show.venue,
          address: show.address || "",
          mapUrl: show.mapUrl || "",
          startsAt: toArgDatetimeLocal(show.startsAt),
          doorsAt: show.doorsAt ? toArgDatetimeLocal(show.doorsAt) : "",
          description: show.description || "",
          coverImageUrl: show.coverImageUrl || "",
          tiers: show.tiers.map((t) => ({
            name: t.name,
            price: String(t.priceArs),
            capacity: String(t.capacity),
          })),
        }}
      />
    </div>
  );
}
