import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Music, ShoppingCart, ScanLine } from "lucide-react";
import { isAdmin, getCurrentUserEmail } from "@/lib/auth";

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

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-card-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo — hide text on mobile */}
          <Link href="/admin/shows" className="flex items-center gap-2 font-bold tracking-wider shrink-0">
            <img src="/logo.png" alt="" className="h-6" />
            <span className="hidden sm:inline">CAPITAN</span>
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
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-muted hover:text-foreground hover:bg-card/50 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Ventas</span>
            </Link>
            <Link
              href="/scan"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-muted hover:text-foreground hover:bg-card/50 transition-colors"
            >
              <ScanLine className="w-4 h-4" />
              <span className="hidden sm:inline">Check-in</span>
            </Link>
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
