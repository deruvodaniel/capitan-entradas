import { prisma } from "../src/lib/db";

async function main() {
  await prisma.$executeRawUnsafe(
    `ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'GUEST'`
  );
  console.log("✓ GUEST added to PaymentMethod enum");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
