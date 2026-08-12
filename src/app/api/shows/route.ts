import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const shows = await prisma.show.findMany({
    where: {
      isPublished: true,
      archivedAt: null,
      startsAt: { gte: new Date() },
    },
    include: {
      tiers: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  const data = shows.map((show) => {
    const minPrice = show.tiers.length
      ? Math.min(...show.tiers.map((t) => t.priceArs))
      : null;
    const totalCapacity = show.tiers.reduce((sum, t) => sum + t.capacity, 0);
    const totalSold = show.tiers.reduce((sum, t) => sum + t.soldCount, 0);

    return {
      id: show.id,
      slug: show.slug,
      title: show.title,
      venue: show.venue,
      address: show.address,
      startsAt: show.startsAt.toISOString(),
      doorsAt: show.doorsAt?.toISOString() ?? null,
      coverImageUrl: show.coverImageUrl,
      minPriceArs: minPrice,
      soldOut: totalCapacity > 0 && totalSold >= totalCapacity,
      tiers: show.tiers.map((t) => ({
        name: t.name,
        priceArs: t.priceArs,
        available: t.capacity - t.soldCount > 0,
      })),
    };
  });

  return NextResponse.json(data, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
