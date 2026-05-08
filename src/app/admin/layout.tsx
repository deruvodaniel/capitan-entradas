import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Music, ShoppingCart, ScanLine, FileSpreadsheet } from "lucide-react";
import { isAdmin, getCurrentUserEmail } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) {
    const email = await getCurrentUserEmail();
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-bold">Acceso restringido</h1>
          <p className="text-muted text-sm">
            Tu cuenta {email ? <strong>{email}</strong> : ""} no tiene permisos
            de administrador. Contactá a un admin si pensás que esto es un
            error.
          </p>
          <div className="pt-3">
            <UserButton />
          </div>
        </div>
      </div>
    );
  }

  // Count pending transfers for badge
  const pendingTransfers = await prisma.order.count({
    where: { paymentMethod: "TRANSFER", status: "PENDING" },
  });

  const sheetsUrl = process.env.GOOGLE_SHEETS_ID
    ? `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEETS_ID.trim()}`
    : null;

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-card-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/admin/shows" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="CAPITAN" className="h-7" />
            <span className="text-accent text-sm font-normal">admin</span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1 sm:gap-4 text-sm mx-2 sm:mx-6">
            <Link
              href="/admin/shows"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-muted hover:text-foreground hover:bg-card/50 transition-colors"
            >
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline">Shows</span>
            </Link>
            <Link
              href="/admin/orders"
              className="relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-muted hover:text-foreground hover:bg-card/50 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Ventas</span>
              {pendingTransfers > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                  {pendingTransfers}
                </span>
              )}
            </Link>
            <Link
              href="/scan"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-muted hover:text-foreground hover:bg-card/50 transition-colors"
            >
              <ScanLine className="w-4 h-4" />
              <span className="hidden sm:inline">Check-in</span>
            </Link>
            {sheetsUrl && (
              <a
                href={sheetsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-muted hover:text-foreground hover:bg-card/50 transition-colors"
                title="Google Sheets"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Sheet</span>
              </a>
            )}
          </nav>

          <UserButton />
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
