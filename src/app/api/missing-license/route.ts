import { NextResponse } from "next/server";
import { z } from "zod";
import { getLeadStore, newId } from "@/lib/leadstore";
import { notifyLead } from "@/lib/lead-notify";
import { requestWithinSize, trustedOrigin } from "@/lib/security";

const schema = z.object({
  type: z.literal("missing-license"),
  businessName: z.string().trim().min(2).max(200),
  contactName: z.string().trim().min(2).max(120),
  email: z.string().email().max(254),
  phone: z.string().trim().max(40).optional(),
  stateCode: z.string().trim().length(2).toUpperCase(),
  licenseNumber: z.string().trim().min(2).max(80),
  trade: z.string().trim().max(80).optional(),
  officialUrl: z.string().url().max(500).optional(),
  message: z.string().trim().max(2000).optional(),
  consent: z.union([z.literal(true), z.literal("true")]),
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  if (!requestWithinSize(request) || !trustedOrigin(request)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.website) return NextResponse.json({ error: "Please check the submitted fields." }, { status: 400 });
  const body = parsed.data;
  const createdAt = new Date().toISOString();
  const lead = {
    id: newId(), type: "claim" as const, status: "new" as const,
    name: body.contactName, email: body.email, phone: body.phone,
    message: [`Missing public license record: ${body.licenseNumber}`, `State: ${body.stateCode}`, `Business: ${body.businessName}`, body.trade ? `Trade: ${body.trade}` : "", body.officialUrl ? `Official record: ${body.officialUrl}` : "", body.message ?? ""].filter(Boolean).join("\n"),
    licenseRef: `${body.stateCode}-${body.licenseNumber}`, createdAt, consentAt: createdAt,
  };
  await getLeadStore().insertLead(lead);
  try { await notifyLead(lead); } catch (error) { console.error("missing-license notification failed", error); }
  return NextResponse.json({ ok: true }, { status: 201 });
}
