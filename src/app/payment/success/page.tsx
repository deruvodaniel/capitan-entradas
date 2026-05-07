import Link from "next/link";
import { prisma } from "@/lib/db";
import { CheckCircle } from "lucide-react";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;

  let tickets: { code: string }[] = [];

  if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { tickets: { select: { code: true } } },
    });
    if (order?.status === "PAID") {
      tickets = order.tickets;
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center py-16">
        <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">¡Pago exitoso!</h1>
        <p className="text-muted mb-6">
          Tu entrada fue generada. Revisá tu email para ver el QR.
        </p>

        {tickets.length > 0 && (
          <div className="space-y-2 mb-6">
            {tickets.map((t) => (
              <Link
                key={t.code}
                href={`/ticket/${t.code}`}
                className="block bg-accent text-white font-medium py-3 px-6 rounded-lg hover:bg-accent-hover transition-colors"
              >
                🎫 Ver entrada {t.code}
              </Link>
            ))}
          </div>
        )}

        <Link href="/" className="text-sm text-muted hover:text-foreground">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
