import { NextResponse } from "next/server";
import { z } from "zod";
import { createBillingPortalSession, retrieveCustomerByEmail } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/site";

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    const parsed = z.object({ email: z.string().email().max(254) }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    const customer = await retrieveCustomerByEmail(parsed.data.email);
    if (!customer || typeof customer.id !== "string") return NextResponse.json({ error: "No billing account was found for that email." }, { status: 404 });
    const session = await createBillingPortalSession(customer.id, absoluteUrl("/get-listed?billing=managed"));
    return NextResponse.json({ url: session.url }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to open billing portal." }, { status: 500 });
  }
}
