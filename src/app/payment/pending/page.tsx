import Link from "next/link";
import { Clock } from "lucide-react";
import Footer from "@/components/Footer";

export default function PaymentPendingPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center py-16">
        <Clock className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Pago pendiente</h1>
        <p className="text-muted mb-6">
          Tu pago está siendo procesado. Cuando se confirme vas a recibir un
          email con tu entrada.
        </p>
        <Link
          href="/"
          className="inline-block bg-accent text-white font-medium py-3 px-6 rounded-lg hover:bg-accent-hover transition-colors"
        >
          Volver al inicio
        </Link>
      </div>

      <Footer />
    </main>
  );
}
