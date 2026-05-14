import { prisma } from "../src/lib/db";

async function main() {
  // Create GuestInviteStatus enum
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "GuestInviteStatus" AS ENUM ('PENDING', 'CLAIMED', 'EXPIRED');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create GuestInvite table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GuestInvite" (
      "id" TEXT NOT NULL,
      "showId" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "quantity" INTEGER NOT NULL DEFAULT 1,
      "label" TEXT,
      "status" "GuestInviteStatus" NOT NULL DEFAULT 'PENDING',
      "orderId" TEXT,
      "claimedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "GuestInvite_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "GuestInvite_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  // Create indexes
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "GuestInvite_token_key" ON "GuestInvite"("token")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GuestInvite_showId_idx" ON "GuestInvite"("showId")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GuestInvite_token_idx" ON "GuestInvite"("token")`);

  console.log("✓ GuestInvite table + enum created");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
