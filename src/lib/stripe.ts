import crypto from "node:crypto";

const API = "https://api.stripe.com/v1";

function secretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return key;
}

async function stripeRequest(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, { ...init, headers: { Authorization: `Bearer ${secretKey()}`, "Content-Type": "application/x-www-form-urlencoded", ...(init.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `Stripe request failed with HTTP ${response.status}.`);
  return body as Record<string, unknown>;
}

function formData(values: Record<string, string | undefined>): string {
  return new URLSearchParams(Object.entries(values).filter((entry): entry is [string, string] => typeof entry[1] === "string")).toString();
}

export async function createCheckoutSession(input: { email: string; customerId?: string; priceId: string; successUrl: string; cancelUrl: string; metadata?: Record<string, string> }) {
  const params: Record<string, string | undefined> = { mode: "subscription", customer: input.customerId, customer_email: input.customerId ? undefined : input.email, "line_items[0][price]": input.priceId, "line_items[0][quantity]": "1", success_url: input.successUrl, cancel_url: input.cancelUrl, "subscription_data[metadata][email]": input.email };
  for (const [key, value] of Object.entries(input.metadata || {})) params[`metadata[${key}]`] = value;
  return stripeRequest("/checkout/sessions", { method: "POST", body: formData(params) });
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  return stripeRequest("/billing_portal/sessions", { method: "POST", body: formData({ customer: customerId, return_url: returnUrl }) });
}

export async function retrieveCustomerByEmail(email: string): Promise<Record<string, unknown> | null> {
  const result = await stripeRequest(`/customers?email=${encodeURIComponent(email)}&limit=1`);
  const data = Array.isArray(result.data) ? result.data : [];
  return (data[0] as Record<string, unknown> | undefined) || null;
}

export function verifyStripeSignature(payload: string, signature: string, toleranceSeconds = 300): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  const parts = Object.fromEntries(signature.split(",").map((part) => part.split("=", 2))) as { t?: string; v1?: string };
  if (!parts.t || !parts.v1) return false;
  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${parts.t}.${payload}`).digest("hex");
  return expected.length === parts.v1.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}
