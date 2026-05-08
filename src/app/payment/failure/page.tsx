import Link from "next/link";
import { XCircle } from "lucide-react";
import Footer from "@/components/Footer";

export default function PaymentFailurePage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center py-16">
        <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Pago rechazado</h1>
        <p className="text-muted mb-6">
          El pago no pudo procesarse. Podés intentar de nuevo.
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
