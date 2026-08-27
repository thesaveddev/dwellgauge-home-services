import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutSession, retrieveCustomerByEmail } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/site";

const schema = z.object({ email: z.string().email().max(254), priceId: z.string().regex(/^price_[A-Za-z0-9]+$/), licenseId: z.string().regex(/^fl-[a-z0-9]+$/).optional() });

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "A valid email and Stripe price are required." }, { status: 400 });
    const customer = await retrieveCustomerByEmail(parsed.data.email);
    const session = await createCheckoutSession({ email: parsed.data.email, customerId: typeof customer?.id === "string" ? customer.id : undefined, priceId: parsed.data.priceId, successUrl: absoluteUrl("/get-listed?billing=success"), cancelUrl: absoluteUrl("/get-listed?billing=cancelled"), metadata: { product: "featured-contractor-listing", ...(parsed.data.licenseId ? { licenseId: parsed.data.licenseId } : {}) } });
    return NextResponse.json({ url: session.url }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start checkout." }, { status: 500 });
  }
}
