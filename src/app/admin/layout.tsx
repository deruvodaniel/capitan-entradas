import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Music, ShoppingCart, ScanLine } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-card-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin/shows" className="font-bold tracking-wider">
              CAPITAN <span className="text-accent text-sm font-normal">admin</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/admin/shows"
                className="flex items-center gap-1.5 text-muted hover:text-foreground"
              >
                <Music className="w-4 h-4" /> Shows
              </Link>
              <Link
                href="/admin/orders"
                className="flex items-center gap-1.5 text-muted hover:text-foreground"
              >
                <ShoppingCart className="w-4 h-4" /> Ventas
              </Link>
              <Link
                href="/scan"
                className="flex items-center gap-1.5 text-muted hover:text-foreground"
              >
                <ScanLine className="w-4 h-4" /> Check-in
              </Link>
            </nav>
          </div>
          <UserButton />
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
