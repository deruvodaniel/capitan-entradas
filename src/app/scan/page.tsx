import ScanCamera from "@/components/ScanCamera";

export default function ScanPage() {
  return (
    <main className="flex-1">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Check-in</h1>
          <p className="text-muted text-sm mt-1">
            Escaneá el QR de la entrada para validar el ingreso
          </p>
        </div>
        <ScanCamera />
      </div>
    </main>
  );
}
