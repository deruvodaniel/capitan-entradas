import nodemailer from "nodemailer";
import { getBaseUrl } from "@/lib/utils";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function logoUrl() {
  return `${getBaseUrl()}/favicon-192.png`;
}

interface AdminTransferNotification {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  showTitle: string;
  tierName: string;
  quantity: number;
  totalArs: number;
  adminUrl: string;
}

export async function sendAdminTransferNotification(
  data: AdminTransferNotification
): Promise<void> {
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) =>
    e.trim()
  );
  if (!adminEmails?.length) return;

  const totalFormatted = `$${(data.totalArs / 100).toLocaleString("es-AR")}`;

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#111;color:#fff;border-radius:16px">
      <div style="text-align:center;padding:16px 0">
        <img src="${logoUrl()}" alt="CAPITAN" width="48" height="48" style="border-radius:8px;margin-bottom:8px" />
        <p style="color:#e6a817;margin:8px 0 0;font-weight:bold;font-size:14px">Nueva transferencia pendiente</p>
      </div>
      <div style="background:#1a1a1a;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #333">
        <p style="margin:0 0 8px;color:#fff"><strong>${data.buyerName}</strong></p>
        <p style="margin:0 0 4px;color:#999;font-size:14px">${data.buyerEmail}${data.buyerPhone ? ` | ${data.buyerPhone}` : ""}</p>
        <hr style="border:none;border-top:1px solid #333;margin:12px 0" />
        <p style="margin:0 0 4px;color:#999;font-size:14px">${data.showTitle}</p>
        <p style="margin:0 0 4px;color:#999;font-size:14px">${data.tierName} x ${data.quantity}</p>
        <p style="margin:12px 0 0;font-size:28px;font-weight:bold;color:#e6a817">${totalFormatted}</p>
      </div>
      <div style="text-align:center;margin:24px 0">
        <a href="${data.adminUrl}" style="background:#16a34a;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;font-size:16px">Confirmar pago</a>
      </div>
      <div style="text-align:center;color:#666;font-size:11px;margin-top:24px">
        <p>Verificá que la transferencia se acreditó antes de confirmar.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"CAPITAN Tickets" <${process.env.GMAIL_USER}>`,
    to: adminEmails.join(","),
    subject: `Transferencia pendiente: ${data.buyerName} — ${totalFormatted}`,
    html,
  });
}

interface TicketEmailData {
  to: string;
  buyerName: string;
  showTitle: string;
  showDate: string;
  venue: string;
  tierName: string;
  quantity: number;
  ticketUrls: string[];
}

export async function sendTicketEmail(data: TicketEmailData): Promise<void> {
  const ticketLinks = data.ticketUrls
    .map(
      (url, i) =>
        `<tr><td style="padding:8px 0"><a href="${url}" style="background:#e6a817;color:#000;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;font-size:14px">Ver entrada${data.quantity > 1 ? ` ${i + 1}` : ""}</a></td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#111;color:#fff;border-radius:16px">
      <div style="text-align:center;padding:20px 0">
        <img src="${logoUrl()}" alt="CAPITAN" width="56" height="56" style="border-radius:10px;margin-bottom:8px" />
        <p style="color:#999;margin:4px 0 0;font-size:13px">Tu entrada está lista</p>
      </div>
      <div style="background:#1a1a1a;border-radius:12px;padding:24px;margin:20px 0;border:1px solid #333">
        <p style="margin:0 0 4px;font-weight:bold;font-size:16px;color:#fff">${data.showTitle}</p>
        <p style="margin:0 0 4px;color:#999;font-size:14px">${data.showDate}</p>
        <p style="margin:0 0 4px;color:#999;font-size:14px">${data.venue}</p>
        <p style="margin:0;color:#999;font-size:14px">${data.tierName} x ${data.quantity}</p>
      </div>
      <div style="text-align:center;margin:24px 0">
        <p style="margin:0 0 16px;color:#ccc;font-size:14px">Hola <strong>${data.buyerName}</strong>, acá ${data.quantity > 1 ? "están tus entradas" : "está tu entrada"}:</p>
        <table style="margin:0 auto"><tbody>${ticketLinks}</tbody></table>
      </div>
      <div style="text-align:center;color:#666;font-size:11px;margin-top:32px;padding-top:16px;border-top:1px solid #333">
        <p style="margin:0 0 4px">Presentá el QR en la puerta. No lo compartas.</p>
        <p style="margin:0;color:#999">CAPITAN</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"CAPITAN Tickets" <${process.env.GMAIL_USER}>`,
    to: data.to,
    subject: `Tu entrada para ${data.showTitle}`,
    html,
  });
}
