/**
 * One-time migration: convert all priceArs / unitPriceArs / totalArs
 * from centavos (legacy) to pesos.
 *
 * Run ONCE before deploying the formatArs fix:
 *   npx tsx scripts/migrate-centavos-to-pesos.ts
 */
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

function cleanUrl(raw: string) {
  const u = new URL(raw);
  u.searchParams.delete("sslmode");
  u.searchParams.delete("pgbouncer");
  return u.toString();
}

const pool = new Pool({
  connectionString: cleanUrl(process.env.DATABASE_URL!),
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const [tiers, orders] = await Promise.all([
    prisma.$executeRaw`UPDATE "TicketTier" SET "priceArs" = "priceArs" / 100`,
    prisma.$executeRaw`UPDATE "Order" SET "unitPriceArs" = "unitPriceArs" / 100, "totalArs" = "totalArs" / 100`,
  ]);

  console.log(`✓ TicketTier rows updated: ${tiers}`);
  console.log(`✓ Order rows updated:      ${orders}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
