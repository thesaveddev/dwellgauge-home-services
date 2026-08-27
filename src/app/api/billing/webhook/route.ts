import { NextResponse } from "next/server";
import { verifyStripeSignature } from "@/lib/stripe";
import { getBillingStore } from "@/lib/billing-store";

export const dynamic = "force-dynamic";

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
    const customerId = typeof object.customer === "string" ? object.customer : undefined;
    const subscriptionId = typeof object.id === "string" && event.type.startsWith("customer.subscription") ? object.id : typeof object.subscription === "string" ? object.subscription : undefined;
    if (customerId && (event.type.startsWith("customer.subscription") || event.type.startsWith("invoice."))) {
      const items = object.items as { data?: Array<{ price?: { id?: unknown } }> } | undefined;
      const priceId = Array.isArray(items?.data) && typeof items.data[0]?.price?.id === "string" ? items.data[0].price.id : undefined;
      await store.upsertSubscription({ customerId, subscriptionId, status: typeof object.status === "string" ? object.status : event.type === "invoice.payment_failed" ? "past_due" : "unknown", priceId, currentPeriodEnd: typeof object.current_period_end === "number" ? new Date(object.current_period_end * 1000).toISOString() : undefined, updatedAt: new Date().toISOString() });
    }
    await store.recordEvent(event.id, event.type);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("stripe webhook failed", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
