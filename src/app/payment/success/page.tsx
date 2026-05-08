import Link from "next/link";
import { prisma } from "@/lib/db";
import { CheckCircle } from "lucide-react";
import { formatArs } from "@/lib/utils";
import TicketReveal from "@/components/TicketReveal";
import Footer from "@/components/Footer";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;

  let orderData: {
    buyerName: string;
    quantity: number;
    totalArs: number;
    show: { title: string };
    tier: { name: string };
  } | null = null;

  if (orderId) {
    orderData = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        buyerName: true,
        quantity: true,
        totalArs: true,
        show: { select: { title: true } },
        tier: { select: { name: true } },
      },
    });
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-8">
      <div className="max-w-sm w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <CheckCircle className="w-14 h-14 mx-auto text-green-500 mb-3" />
          <h1 className="text-2xl font-bold">Pago exitoso</h1>
          {orderData && (
            <div className="mt-3 text-sm text-muted space-y-0.5">
              <p className="font-medium text-foreground">
                {orderData.show.title}
              </p>
              <p>
                {orderData.tier.name} x {orderData.quantity} —{" "}
                {formatArs(orderData.totalArs)}
              </p>
            </div>
          )}
        </div>

        {/* QR Tickets */}
        {orderId ? (
          <TicketReveal orderId={orderId} />
        ) : (
          <p className="text-muted text-center text-sm">
            Vas a recibir tu entrada por email.
          </p>
        )}

        <div className="text-center mt-6">
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
