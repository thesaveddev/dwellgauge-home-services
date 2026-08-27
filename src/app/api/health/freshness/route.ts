import { NextResponse } from "next/server";
import { getDatasetFreshness } from "@/lib/freshness";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = process.env.FRESHNESS_MONITOR_TOKEN;
  if (expected && request.headers.get("authorization") !== `Bearer ${expected}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const datasets = getDatasetFreshness();
  const healthy = datasets.every((dataset) => dataset.status === "healthy");
  return NextResponse.json({ ok: healthy, checkedAt: new Date().toISOString(), datasets }, { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
