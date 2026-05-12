/**
 * One-time migration: convert all priceArs / unitPriceArs / totalArs
 * from centavos (legacy) to pesos.
 *
 * Run ONCE before deploying the formatArs fix:
 *   npx tsx scripts/migrate-centavos-to-pesos.ts
 */
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

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
