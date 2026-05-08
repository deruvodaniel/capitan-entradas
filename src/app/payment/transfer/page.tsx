import Link from "next/link";
import { prisma } from "@/lib/db";
import { Clock, Copy, Building2 } from "lucide-react";
import { formatArs } from "@/lib/utils";
import CopyButton from "@/components/CopyButton";
import Footer from "@/components/Footer";

export default async function PaymentTransferPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;

  const order = orderId
    ? await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          buyerName: true,
          buyerEmail: true,
          quantity: true,
          totalArs: true,
          show: { select: { title: true } },
          tier: { select: { name: true } },
        },
      })
    : null;

  const cbu = process.env.TRANSFER_CBU || "";
  const alias = process.env.TRANSFER_ALIAS || "";
  const holder = process.env.TRANSFER_HOLDER || "";

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-8">
      <div className="max-w-sm w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <Clock className="w-14 h-14 mx-auto text-yellow-400 mb-3" />
          <h1 className="text-2xl font-bold">Transferencia pendiente</h1>
          {order && (
            <div className="mt-3 text-sm text-muted space-y-0.5">
              <p className="font-medium text-foreground">
                {order.show.title}
              </p>
              <p>
                {order.tier.name} x {order.quantity}
              </p>
            </div>
          )}
        </div>

        {/* Amount */}
        {order && (
          <div className="text-center py-4 bg-accent/10 border border-accent/30 rounded-xl">
            <p className="text-sm text-muted mb-1">Monto a transferir</p>
            <p className="text-3xl font-bold text-accent">
              {formatArs(order.totalArs)}
            </p>
          </div>
        )}

        {/* Bank details */}
        <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted">
            <Building2 className="w-4 h-4" />
            Datos bancarios
          </div>

          {alias && (
            <div className="space-y-1">
              <p className="text-xs text-muted uppercase tracking-wider">Alias</p>
              <div className="flex items-center justify-between bg-background rounded-lg px-3 py-2.5 border border-card-border">
                <span className="font-mono font-bold text-sm">{alias}</span>
                <CopyButton text={alias} />
              </div>
            </div>
          )}

          {cbu && (
            <div className="space-y-1">
              <p className="text-xs text-muted uppercase tracking-wider">CBU</p>
              <div className="flex items-center justify-between bg-background rounded-lg px-3 py-2.5 border border-card-border">
                <span className="font-mono text-xs break-all">{cbu}</span>
                <CopyButton text={cbu} />
              </div>
            </div>
          )}

          {holder && (
            <div className="space-y-1">
              <p className="text-xs text-muted uppercase tracking-wider">Titular</p>
              <p className="text-sm font-medium">{holder}</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm space-y-2">
          <p>
            Una vez que realices la transferencia, te vamos a enviar las entradas
            por email a{" "}
            <strong className="text-foreground">
              {order?.buyerEmail || "tu email"}
            </strong>{" "}
            cuando confirmemos el pago.
          </p>
          <p className="text-muted text-xs">
            La confirmación puede demorar hasta unas horas.
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-muted hover:text-foreground"
          >
            Volver al inicio
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
