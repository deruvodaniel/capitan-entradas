import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface AdminTransferNotification {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
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
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <div style="text-align:center;padding:16px 0">
        <h1 style="font-size:24px;margin:0;letter-spacing:2px">CAPITAN</h1>
        <p style="color:#e6a817;margin:8px 0 0;font-weight:bold">💸 Nueva transferencia pendiente</p>
      </div>
      <div style="background:#f9f9f9;border-radius:12px;padding:20px;margin:20px 0">
        <p style="margin:0 0 8px"><strong>${data.buyerName}</strong> (${data.buyerEmail})</p>
        <p style="margin:0 0 4px;color:#666">🎸 ${data.showTitle}</p>
        <p style="margin:0 0 4px;color:#666">🎟️ ${data.tierName} × ${data.quantity}</p>
        <p style="margin:12px 0 0;font-size:24px;font-weight:bold">${totalFormatted}</p>
      </div>
      <div style="text-align:center;margin:24px 0">
        <a href="${data.adminUrl}" style="background:#16a34a;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;font-size:16px">Confirmar pago</a>
      </div>
      <div style="text-align:center;color:#999;font-size:12px;margin-top:24px">
        <p>Verificá que la transferencia se acreditó antes de confirmar.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"CAPITAN Tickets" <${process.env.GMAIL_USER}>`,
    to: adminEmails.join(","),
    subject: `💸 Transferencia pendiente: ${data.buyerName} — ${totalFormatted}`,
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
        `<tr><td style="padding:8px 0"><a href="${url}" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block">🎫 Entrada ${data.quantity > 1 ? i + 1 : ""}</a></td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <div style="text-align:center;padding:20px 0">
        <h1 style="font-size:28px;margin:0;letter-spacing:2px">CAPITAN</h1>
        <p style="color:#666;margin:4px 0 0">🎸 Tu entrada está lista</p>
      </div>
      <div style="background:#f9f9f9;border-radius:12px;padding:24px;margin:20px 0">
        <p style="margin:0 0 4px"><strong>${data.showTitle}</strong></p>
        <p style="margin:0 0 4px;color:#666">📅 ${data.showDate}</p>
        <p style="margin:0 0 4px;color:#666">📍 ${data.venue}</p>
        <p style="margin:0;color:#666">🎟️ ${data.tierName} × ${data.quantity}</p>
      </div>
      <div style="text-align:center;margin:24px 0">
        <p style="margin:0 0 12px">Hola <strong>${data.buyerName}</strong>, acá ${data.quantity > 1 ? "están tus entradas" : "está tu entrada"}:</p>
        <table style="margin:0 auto"><tbody>${ticketLinks}</tbody></table>
      </div>
      <div style="text-align:center;color:#999;font-size:12px;margin-top:32px;padding-top:16px;border-top:1px solid #eee">
        <p>Presentá el QR en la puerta. No lo compartas.</p>
        <p>CAPITAN 🤘</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"CAPITAN Tickets" <${process.env.GMAIL_USER}>`,
    to: data.to,
    subject: `🎫 Tu entrada para ${data.showTitle}`,
    html,
  });
}
