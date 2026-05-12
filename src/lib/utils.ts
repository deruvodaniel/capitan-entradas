import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatArs(pesos: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(pesos);
}

const AR_TZ = "America/Argentina/Buenos_Aires";

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: AR_TZ,
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: AR_TZ,
  }).format(new Date(date));
}

/**
 * Convert a UTC Date to "YYYY-MM-DDTHH:mm" in Argentina timezone.
 * Used for populating datetime-local inputs on the server.
 */
export function toArgDatetimeLocal(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: AR_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/**
 * Parse a "YYYY-MM-DDTHH:mm" string that represents Argentina local time
 * into a UTC Date. Used when receiving datetime-local form values on the server.
 */
export function parseArgDatetimeLocal(s: string): Date {
  // Append Argentina offset (-03:00) so JS interprets it correctly
  return new Date(`${s}:00-03:00`);
}

export function getBaseUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}


/** Returns the explicit Maps URL if set, otherwise null. No auto-generation. */
export function getMapsUrl(opts: {
  mapUrl?: string | null;
}): string | null {
  return opts.mapUrl || null;
}
