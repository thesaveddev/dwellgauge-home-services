import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin-auth";
import { getLeadStore, type ClaimStatus } from "@/lib/leadstore";
import { recordAudit } from "@/lib/audit";

export async function PATCH(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  if (!verifyToken((await cookies()).get("tp_admin")?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: string; status?: ClaimStatus } | null;
  if (!body?.id || !body.status || !["pending", "approved", "rejected"].includes(body.status)) return NextResponse.json({ error: "Invalid claim update." }, { status: 400 });
  await getLeadStore().updateClaimStatus(body.id, body.status);
  await recordAudit({ actor: "admin", action: "claim.status.updated", entityType: "claim", entityId: body.id, metadata: { status: body.status }, ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() });
  return NextResponse.json({ ok: true });
}
