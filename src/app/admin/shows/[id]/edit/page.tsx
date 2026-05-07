import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import ShowForm from "@/components/ShowForm";

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

  const toLocalDatetime = (d: Date) => {
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  async function updateShow(formData: FormData) {
    "use server";

    const title = formData.get("title") as string;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const venue = formData.get("venue") as string;
    const address = (formData.get("address") as string) || null;
    const startsAt = new Date(formData.get("startsAt") as string);
    const doorsAtRaw = formData.get("doorsAt") as string;
    const doorsAt = doorsAtRaw ? new Date(doorsAtRaw) : null;
    const description = (formData.get("description") as string) || null;
    const coverImageUrl = (formData.get("coverImageUrl") as string) || null;

    const tierNames = formData.getAll("tierName") as string[];
    const tierPrices = formData.getAll("tierPrice") as string[];
    const tierCapacities = formData.getAll("tierCapacity") as string[];

    const newTiers = tierNames
      .map((name, i) => ({
        name,
        priceArs: Math.round(parseFloat(tierPrices[i]) * 100),
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
          startsAt: toLocalDatetime(show.startsAt),
          doorsAt: show.doorsAt ? toLocalDatetime(show.doorsAt) : "",
          description: show.description || "",
          coverImageUrl: show.coverImageUrl || "",
          tiers: show.tiers.map((t) => ({
            name: t.name,
            price: String(t.priceArs / 100),
            capacity: String(t.capacity),
          })),
        }}
      />
    </div>
  );
}
