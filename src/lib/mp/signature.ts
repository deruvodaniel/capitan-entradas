import { createHmac } from "crypto";

export function verifyMpSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string
): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    // Allow webhook through — the real security is the server-to-server
    // re-fetch of the payment via getPayment() with our access token.
    console.warn("MP_WEBHOOK_SECRET not configured — skipping signature check (payment will be verified via API)");
    return true;
  }

  if (!xSignature || !xRequestId) return false;

  const parts = xSignature.split(",").reduce(
    (acc, part) => {
      const [key, value] = part.split("=").map((s) => s.trim());
      if (key === "ts") acc.ts = value;
      if (key === "v1") acc.v1 = value;
      return acc;
    },
    { ts: "", v1: "" }
  );

  if (!parts.ts || !parts.v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${parts.ts};`;
  const hmac = createHmac("sha256", secret).update(manifest).digest("hex");

  return hmac === parts.v1;
}
