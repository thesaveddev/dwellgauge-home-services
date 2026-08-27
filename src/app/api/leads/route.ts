import { NextResponse } from "next/server";
import { z } from "zod";
import { getLicense } from "@/lib/datasets";
import { getLeadStore, newId, type LeadType } from "@/lib/leadstore";
import { notifyLead } from "@/lib/lead-notify";
import { requestWithinSize, trustedOrigin } from "@/lib/security";

const recentRequests = new Map<string, { count: number; startedAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 8;

function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

const schema = z.object({
  type: z.enum(["quote", "claim", "subscribe"]).default("quote"),
  name: z.string().trim().max(120).optional(),
  contactName: z.string().trim().max(120).optional(),
  businessName: z.string().trim().max(200).optional(),
  email: z.string().email().max(254),
  phone: z.string().trim().max(40).optional(),
  zip: z.string().regex(/^\d{5}$/).optional(),
  message: z.string().trim().max(4000).optional(),
  serviceSlug: z.string().max(100).optional(),
  metroSlug: z.string().max(100).optional(),
  licenseRef: z.string().max(100).optional(),
  landingPath: z.string().max(500).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  consent: z.union([z.literal(true), z.literal("true")]),
  website: z.string().max(0).optional(),
}).superRefine((body, ctx) => {
  if (body.type === "claim") {
    if (body.licenseRef && !getLicense(body.licenseRef)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["licenseRef"], message: "A valid license record is required." });
    if (!body.businessName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["businessName"], message: "Business name is required." });
    if (!body.contactName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["contactName"], message: "Contact name is required." });
  } else if (!body.name || !body.phone || !body.zip || !body.message) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["message"], message: "Name, phone, ZIP code, and project details are required." });
  }
});

export async function POST(request: Request) {
  try {
    if (!requestWithinSize(request)) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    if (!trustedOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    const key = clientKey(request);
    const now = Date.now();
    const previous = recentRequests.get(key);
    const current = previous && now - previous.startedAt < WINDOW_MS ? previous : { count: 0, startedAt: now };
    current.count += 1;
    recentRequests.set(key, current);
    if (current.count > MAX_REQUESTS) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success || parsed.data.website) return NextResponse.json({ error: "Please check the submitted fields." }, { status: 400 });
    const body = parsed.data;
    const id = newId();
    const createdAt = new Date().toISOString();
    const store = getLeadStore();
    if (body.type === "claim") {
      const claim = { id, licenseId: body.licenseRef ?? "unlisted", businessName: body.businessName!, contactName: body.contactName!, email: body.email, phone: body.phone, message: body.message, status: "pending" as const, consentAt: createdAt, createdAt };
      await store.insertClaim(claim);
      try { await notifyLead(claim); } catch (error) { console.error("claim notification failed", error); }
    } else {
      const lead = { id, type: body.type as LeadType, status: "new" as const, name: body.name, email: body.email, phone: body.phone, message: body.message, serviceSlug: body.serviceSlug, metroSlug: body.metroSlug, licenseRef: body.licenseRef, landingPath: body.landingPath, utmSource: body.utmSource, utmMedium: body.utmMedium, utmCampaign: body.utmCampaign, consentAt: createdAt, createdAt };
      await store.insertLead(lead);
      try { await notifyLead(lead); } catch (error) { console.error("lead notification failed", error); }
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to save request." }, { status: 500 });
  }
}
