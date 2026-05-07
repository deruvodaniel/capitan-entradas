const MP_BASE = "https://api.mercadopago.com";

function getAccessToken(): string {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("MP_ACCESS_TOKEN not set");
  return token;
}

export async function mpFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${MP_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MP API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export interface MpPreferenceItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
}

export interface MpPreferenceRequest {
  items: MpPreferenceItem[];
  payer: { name: string; email: string };
  external_reference: string;
  notification_url: string;
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return: "approved" | "all";
  statement_descriptor: string;
  expires?: boolean;
  expiration_date_to?: string;
}

export interface MpPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export interface MpPayment {
  id: number;
  status: string;
  status_detail: string;
  external_reference: string;
  transaction_amount: number;
  currency_id: string;
  payer: { email: string };
}

export function createPreference(
  data: MpPreferenceRequest
): Promise<MpPreferenceResponse> {
  return mpFetch("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getPayment(paymentId: string): Promise<MpPayment> {
  return mpFetch(`/v1/payments/${paymentId}`);
}

export function refundPayment(paymentId: string): Promise<unknown> {
  return mpFetch(`/v1/payments/${paymentId}/refunds`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
