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

/** Pestaña histórica, usada por los shows anteriores a `sheetTab`. */
export const DEFAULT_SHEET_TAB = "Ventas";

const HEADERS = [
  "timestamp",
  "orderId",
  "paymentId",
  "showTitle",
  "showDate",
  "tier",
  "quantity",
  "totalArs",
  "buyerName",
  "buyerEmail",
  "buyerDni",
  "buyerPhone",
];

/**
 * Los nombres de pestaña de Google Sheets no admiten : \ / ? * [ ] y tienen
 * un máximo de 100 caracteres.
 */
export function toSheetTabName(title: string): string {
  return (
    title
      .replace(/[:\\/?*[\]]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100) || "Show"
  );
}

/**
 * Crea la pestaña del show si no existe y le escribe los headers.
 * Devuelve el nombre final, que puede diferir del pedido si ya estaba tomado.
 * Idempotente: si la pestaña ya existe se reutiliza tal cual.
 */
export async function ensureShowSheet(title: string): Promise<string | null> {
  const sheetsId = process.env.GOOGLE_SHEETS_ID?.trim();
  if (!sheetsId) {
    console.warn("GOOGLE_SHEETS_ID not set, skipping sheet creation");
    return null;
  }

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetsId });
  const existing = new Set(
    (meta.data.sheets || []).map((s) => s.properties?.title).filter(Boolean)
  );

  const base = toSheetTabName(title);
  if (existing.has(base)) return base;

  // Desambigua si el título choca con otra pestaña: "Titulo (2)", "(3)"...
  let name = base;
  for (let i = 2; existing.has(name); i++) {
    const suffix = ` (${i})`;
    name = base.slice(0, 100 - suffix.length) + suffix;
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetsId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: name } } }],
    },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetsId,
    range: `${name}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [HEADERS] },
  });

  console.log("[Sheets] Pestaña creada:", name);
  return name;
}

/**
 * Read existing order IDs from column B of a sheet tab.
 * Used by sync to skip orders that are already present.
 */
export async function getExistingOrderIds(
  tab: string = DEFAULT_SHEET_TAB
): Promise<Set<string>> {
  const sheetsId = process.env.GOOGLE_SHEETS_ID?.trim();
  if (!sheetsId) return new Set();

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetsId,
    range: `${tab}!B:B`, // Column B = orderId
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

export async function appendSaleToSheet(
  row: SaleRow,
  tab: string = DEFAULT_SHEET_TAB
): Promise<void> {
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
    range: `${tab}!A:L`,
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
