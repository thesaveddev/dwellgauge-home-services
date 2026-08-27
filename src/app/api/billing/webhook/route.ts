import { NextResponse } from "next/server";
import { verifyStripeSignature } from "@/lib/stripe";
import { getBillingStore, isSubscriptionActive, type SubscriptionState } from "@/lib/billing-store";
import { createPool } from "@/lib/db";

export const dynamic = "force-dynamic";

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function objectMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function subscriptionState(eventType: string, object: Record<string, unknown>, customerId: string, priceId?: string): SubscriptionState {
  return {
    customerId,
    subscriptionId: stringValue(object.id) ?? stringValue(object.subscription),
    status: stringValue(object.status) ?? (eventType === "invoice.payment_failed" ? "past_due" : "unknown"),
    priceId,
    currentPeriodEnd: typeof object.current_period_end === "number" ? new Date(object.current_period_end * 1000).toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  };
}

async function updateProfileBilling(licenseId: string, customerId: string, featured: boolean): Promise<void> {
  const db = createPool(2);
  try {
    await db.query(
      `update contractor_profiles
          set billing_customer_id = $1,
              featured = $2,
              revised_by = 'stripe-webhook',
              revised_at = now()
        where license_id = $3`,
      [customerId, featured, licenseId],
    );
  } finally {
    await db.end();
  }
}

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });

  try {
    if (!verifyStripeSignature(payload, signature)) return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
    const event = JSON.parse(payload) as { id?: string; type?: string; data?: { object?: Record<string, unknown> } };
    if (!event.id || !event.type || !event.data?.object) return NextResponse.json({ error: "Malformed Stripe event." }, { status: 400 });

    const store = getBillingStore();
    if (await store.hasEvent(event.id)) return NextResponse.json({ received: true, duplicate: true });

    const object = event.data.object;
    const metadata = objectMetadata(object.metadata);
    const customerId = stringValue(object.customer);
    const licenseId = stringValue(metadata.licenseId);
    const items = object.items as { data?: Array<{ price?: { id?: unknown } }> } | undefined;
    const priceId = Array.isArray(items?.data) && typeof items.data[0]?.price?.id === "string" ? items.data[0].price.id : undefined;

    const isSubscriptionEvent = event.type.startsWith("customer.subscription") || event.type.startsWith("invoice.");
    if (customerId && isSubscriptionEvent) {
      const state = subscriptionState(event.type, object, customerId, priceId);
      await store.upsertSubscription(state);
      if (licenseId) await updateProfileBilling(licenseId, customerId, isSubscriptionActive(state));
    }

    // Checkout metadata is the first reliable point at which the license profile
    // can be associated with the Stripe customer. Subscription events then keep
    // the featured flag synchronized as renewals, failures, and cancellations occur.
    if (event.type === "checkout.session.completed" && customerId && licenseId) {
      await updateProfileBilling(licenseId, customerId, true);
    }

    await store.recordEvent(event.id, event.type);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("stripe webhook failed", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
