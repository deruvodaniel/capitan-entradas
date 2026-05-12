import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import ShowForm from "@/components/ShowForm";
import { parseArgDatetimeLocal } from "@/lib/utils";

export default function NewShowPage() {
  async function createShow(formData: FormData) {
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

    // Parse tiers
    const tierNames = formData.getAll("tierName") as string[];
    const tierPrices = formData.getAll("tierPrice") as string[];
    const tierCapacities = formData.getAll("tierCapacity") as string[];

    const tiers = tierNames
      .map((name, i) => ({
        name,
        priceArs: Math.round(parseFloat(tierPrices[i]) * 100),
        capacity: parseInt(tierCapacities[i]),
        sortOrder: i,
      }))
      .filter((t) => t.name && t.priceArs > 0 && t.capacity > 0);

    await prisma.show.create({
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
        tiers: { create: tiers },
      },
    });

    revalidatePath("/admin/shows");
    redirect("/admin/shows");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Nuevo show</h1>
      <ShowForm action={createShow} />
    </div>
  );
}
