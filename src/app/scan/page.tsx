import ScanCamera from "@/components/ScanCamera";
import { isAdmin, getCurrentUserEmail } from "@/lib/auth";

export default async function ScanPage() {
  if (!(await isAdmin())) {
    const email = await getCurrentUserEmail();
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-bold">Acceso restringido</h1>
          <p className="text-muted text-sm">
            Tu cuenta {email ? <strong>{email}</strong> : ""} no tiene permisos
            para hacer check-in.
          </p>
        </div>
      </main>
    );
  }
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
