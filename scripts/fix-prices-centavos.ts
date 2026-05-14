import { prisma } from "../src/lib/db";

/**
 * Migration: prices were stored as centavos (value * 100) but the app
 * treats them as pesos. Divide all monetary fields by 100 to normalize.
 */
async function main() {
  // Fix TicketTier.priceArs (skip the "Invitados" tier which is already 0)
  const tiersUpdated = await prisma.$executeRawUnsafe(`
    UPDATE "TicketTier"
    SET "priceArs" = "priceArs" / 100
    WHERE "priceArs" > 0
  `);
  console.log(`✓ TicketTier: ${tiersUpdated} rows updated`);

  // Fix Order monetary fields
  const ordersUpdated = await prisma.$executeRawUnsafe(`
    UPDATE "Order"
    SET
      "unitPriceArs" = "unitPriceArs" / 100,
      "totalArs" = "totalArs" / 100
    WHERE "unitPriceArs" > 0 OR "totalArs" > 0
  `);
  console.log(`✓ Order: ${ordersUpdated} rows updated`);

  await prisma.$disconnect();
  console.log("\nDone. All prices are now stored in pesos.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
