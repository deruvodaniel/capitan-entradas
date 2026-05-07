import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const show = await prisma.show.upsert({
    where: { slug: "capitan-monte-grande-mayo-2026" },
    update: {},
    create: {
      title: "CAPITAN en Monte Grande",
      slug: "capitan-monte-grande-mayo-2026",
      venue: "11pm Centro Cultural",
      address: "Monte Grande, Buenos Aires",
      startsAt: new Date("2026-05-16T22:00:00-03:00"),
      doorsAt: new Date("2026-05-16T21:00:00-03:00"),
      description:
        "CAPITAN en vivo en 11pm Centro Cultural. Una noche de rock que no te podés perder.",
      isPublished: true,
      tiers: {
        create: [
          {
            name: "Anticipada",
            priceArs: 800000,
            capacity: 100,
            sortOrder: 0,
          },
          {
            name: "Promo 2x15000",
            priceArs: 750000,
            capacity: 50,
            sortOrder: 1,
          },
        ],
      },
    },
  });

  console.log("Seeded show:", show.title, show.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
