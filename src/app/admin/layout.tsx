import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { isAdmin, getCurrentUserEmail } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminNav from "@/components/AdminNav";

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
      <header className="border-b border-card-border sticky top-0 bg-background/95 backdrop-blur z-30">
        <div className="relative max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/admin/shows"
            className="flex items-center gap-2 shrink-0"
          >
            <img src="/logo.png" alt="CAPITAN" className="h-7" />
            <span className="text-accent text-sm font-normal">admin</span>
          </Link>

          {/* Nav (desktop inline, mobile hamburger) */}
          <AdminNav
            pendingTransfers={pendingTransfers}
            sheetsUrl={sheetsUrl}
          />

          <UserButton />
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
