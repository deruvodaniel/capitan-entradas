"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Music,
  ShoppingCart,
  ScanLine,
  FileSpreadsheet,
  Menu,
  X,
} from "lucide-react";

interface AdminNavProps {
  pendingTransfers: number;
  sheetsUrl: string | null;
}

const NAV_ITEMS = [
  { href: "/admin/shows", label: "Shows", icon: Music },
  { href: "/admin/orders", label: "Ventas", icon: ShoppingCart, badge: true },
  { href: "/scan", label: "Check-in", icon: ScanLine },
];

export default function AdminNav({
  pendingTransfers,
  sheetsUrl,
}: AdminNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden sm:flex items-center gap-1 sm:gap-2 mx-2 sm:mx-6 text-sm">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              isActive(item.href)
                ? "text-accent bg-accent/10"
                : "text-muted hover:text-foreground hover:bg-card/50"
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
            {item.badge && pendingTransfers > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                {pendingTransfers}
              </span>
            )}
          </Link>
        ))}
        {sheetsUrl && (
          <a
            href={sheetsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted hover:text-foreground hover:bg-card/50 transition-colors"
            title="Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Sheet</span>
          </a>
        )}
      </nav>

      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="sm:hidden p-2 rounded-lg text-muted hover:text-foreground hover:bg-card/50 relative"
        aria-label="Menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        {!open && pendingTransfers > 0 && (
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {/* Mobile dropdown */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full right-4 mt-1 w-56 bg-card border border-card-border rounded-xl shadow-lg z-50 py-2 sm:hidden">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  isActive(item.href)
                    ? "text-accent bg-accent/10"
                    : "text-muted hover:text-foreground hover:bg-background"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge && pendingTransfers > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
                    {pendingTransfers}
                  </span>
                )}
              </Link>
            ))}
            {sheetsUrl && (
              <a
                href={sheetsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-muted hover:text-foreground hover:bg-background transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Google Sheets</span>
              </a>
            )}
          </div>
        </>
      )}
    </>
  );
}
