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

/**
 * Read existing order IDs from column B of the "Ventas" sheet.
 * Used by sync to skip orders that are already present.
 */
export async function getExistingOrderIds(): Promise<Set<string>> {
  const sheetsId = process.env.GOOGLE_SHEETS_ID?.trim();
  if (!sheetsId) return new Set();

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetsId,
    range: "Ventas!B:B", // Column B = orderId
  });

  const rows = res.data.values || [];
  const ids = new Set<string>();
  for (const row of rows) {
    if (row[0] && row[0] !== "orderId") {
      ids.add(row[0]);
    }
  }
  return ids;
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
          row.totalArs,
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
