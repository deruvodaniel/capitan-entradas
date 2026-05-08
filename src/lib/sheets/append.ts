import { google } from "googleapis";

function getAuth() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!json) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not set");

  const credentials = JSON.parse(
    Buffer.from(json, "base64").toString("utf8")
  );
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

interface SaleRow {
  timestamp: string;
  orderId: string;
  paymentId: string;
  showTitle: string;
  showDate: string;
  tier: string;
  quantity: number;
  totalArs: number;
  buyerName: string;
  buyerEmail: string;
  buyerDni: string;
  buyerPhone: string;
}

export async function appendSaleToSheet(row: SaleRow): Promise<void> {
  const sheetsId = process.env.GOOGLE_SHEETS_ID?.trim();
  if (!sheetsId) {
    console.warn("GOOGLE_SHEETS_ID not set, skipping sheets append");
    return;
  }

  console.log("[Sheets] Appending row for order", row.orderId, "to sheet", sheetsId.slice(0, 8) + "...");

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: sheetsId,
    range: "Ventas!A:L",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          row.timestamp,
          row.orderId,
          row.paymentId,
          row.showTitle,
          row.showDate,
          row.tier,
          row.quantity,
          row.totalArs / 100,
          row.buyerName,
          row.buyerEmail,
          row.buyerDni || "",
          row.buyerPhone || "",
        ],
      ],
    },
  });

  console.log("[Sheets] Success:", res.data.updates?.updatedRange);
}
