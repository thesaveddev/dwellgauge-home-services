import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin-auth";
import { getLeadStore, type LeadStatus, type Lead } from "@/lib/leadstore";
import { recordAudit } from "@/lib/audit";

export async function GET() {
  if (!verifyToken((await cookies()).get("tp_admin")?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const store = getLeadStore();
  return NextResponse.json({ leads: await store.listLeads(), claims: await store.listClaims() });
}

export async function PATCH(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  if (!verifyToken((await cookies()).get("tp_admin")?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: string; status?: LeadStatus; outcome?: Lead["outcome"]; assignedContractor?: string; revenueCents?: number; currency?: string } | null;
  if (!body?.id || (body.status && !["new", "routed", "archived"].includes(body.status)) || (body.outcome && !["new", "contacted", "won", "lost"].includes(body.outcome)) || (body.revenueCents !== undefined && (!Number.isInteger(body.revenueCents) || body.revenueCents < 0 || body.revenueCents > 100_000_000))) return NextResponse.json({ error: "Invalid lead update." }, { status: 400 });
  await getLeadStore().updateLeadOutcome(body.id, body);
  await recordAudit({ actor: "admin", action: "lead.outcome.updated", entityType: "lead", entityId: body.id, metadata: { status: body.status, outcome: body.outcome, assignedContractor: body.assignedContractor, revenueCents: body.revenueCents } });
  return NextResponse.json({ ok: true });
}
