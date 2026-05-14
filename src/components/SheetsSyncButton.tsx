"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

export default function SheetsSyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    alreadyInSheet: number;
    synced: number;
    failed: number;
  } | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/sheets-sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        setResult({ total: 0, alreadyInSheet: 0, synced: 0, failed: -1 });
      }
    } catch {
      setResult({ total: 0, alreadyInSheet: 0, synced: 0, failed: -1 });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-2 px-3 py-1.5 text-xs bg-green-600 text-white font-medium rounded-lg hover:bg-green-500 disabled:opacity-50 transition-colors"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
        {syncing ? "Sincronizando..." : "Sync Sheets"}
      </button>
      {result && (
        <span className="text-xs text-muted">
          {result.failed === -1
            ? "Error al sincronizar"
            : result.synced > 0
              ? `${result.synced} nueva${result.synced !== 1 ? "s" : ""} agregada${result.synced !== 1 ? "s" : ""}`
              : "Todo sincronizado, sin nuevas"}
          {result.failed > 0 && ` (${result.failed} fallaron)`}
        </span>
      )}
    </div>
  );
}
