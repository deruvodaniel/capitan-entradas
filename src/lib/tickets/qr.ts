import jwt from "jsonwebtoken";
import QRCode from "qrcode";

function getSecret(): string {
  const secret = process.env.TICKET_JWT_SECRET;
  if (!secret) throw new Error("TICKET_JWT_SECRET not set");
  return secret;
}

interface QrPayload {
  tid: string;
  oid: string;
  sid: string;
}

export function generateQrToken(
  ticketId: string,
  orderId: string,
  showId: string,
  showStartsAt: Date
): string {
  const expiresAt = new Date(showStartsAt.getTime() + 6 * 60 * 60 * 1000);

  return jwt.sign(
    { tid: ticketId, oid: orderId, sid: showId } satisfies QrPayload,
    getSecret(),
    { expiresIn: Math.floor((expiresAt.getTime() - Date.now()) / 1000) }
  );
}

export function verifyQrToken(token: string): QrPayload {
  return jwt.verify(token, getSecret()) as QrPayload;
}

export async function generateQrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: "M",
    width: 300,
    margin: 2,
  });
}
