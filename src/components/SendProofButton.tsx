"use client";

import { MessageCircle, Mail } from "lucide-react";

interface SendProofButtonProps {
  orderId: string;
  buyerName: string;
  totalFormatted: string;
  showTitle: string;
  adminWhatsApp?: string;
  adminEmail?: string;
}

export default function SendProofButton({
  orderId,
  buyerName,
  totalFormatted,
  showTitle,
  adminWhatsApp,
  adminEmail,
}: SendProofButtonProps) {
  const message = `Hola! Soy ${buyerName}. Acabo de transferir ${totalFormatted} para ${showTitle}. Mi orden es ${orderId.slice(0, 8)}. Adjunto el comprobante.`;

  const whatsappUrl = adminWhatsApp
    ? `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(message)}`
    : null;

  const emailSubject = `Comprobante de transferencia — ${buyerName}`;
  const emailBody = `${message}\n\n(Adjuntá el comprobante a este email)`;
  const emailUrl = adminEmail
    ? `mailto:${adminEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    : null;

  if (!whatsappUrl && !emailUrl) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted text-center">
        Enviá el comprobante para agilizar la confirmación
      </p>
      <div className="flex gap-2">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-xl transition-colors text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        )}
        {emailUrl && (
          <a
            href={emailUrl}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-card border border-card-border hover:border-muted text-muted hover:text-foreground font-medium rounded-xl transition-colors text-sm"
          >
            <Mail className="w-4 h-4" />
            Email
          </a>
        )}
      </div>
    </div>
  );
}
