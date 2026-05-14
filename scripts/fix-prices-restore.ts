import { prisma } from "../src/lib/db";

/**
 * Restore prices: the previous migration divided by 100 incorrectly.
 * Values were already in pesos — multiply back by 100 to restore.
 */
async function main() {
  const tiersUpdated = await prisma.$executeRawUnsafe(`
    UPDATE "TicketTier"
    SET "priceArs" = "priceArs" * 100
    WHERE "priceArs" > 0
  `);
  console.log(`✓ TicketTier: ${tiersUpdated} rows restored`);

  const ordersUpdated = await prisma.$executeRawUnsafe(`
    UPDATE "Order"
    SET
      "unitPriceArs" = "unitPriceArs" * 100,
      "totalArs" = "totalArs" * 100
    WHERE "unitPriceArs" > 0 OR "totalArs" > 0
  `);
  console.log(`✓ Order: ${ordersUpdated} rows restored`);

  // Verify
  const tiers = await prisma.$queryRawUnsafe(`SELECT name, "priceArs" FROM "TicketTier" WHERE "priceArs" > 0`);
  console.log("\nTier prices after restore:", tiers);

  const orders = await prisma.$queryRawUnsafe(`SELECT id, "unitPriceArs", "totalArs" FROM "Order" WHERE "totalArs" > 0 LIMIT 5`);
  console.log("Order prices after restore:", orders);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
