import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/admin-auth";
import { getConversionReport, getSearchConsoleReport } from "@/lib/reporting";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!verifyToken((await cookies()).get("tp_admin")?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const days = Math.min(90, Math.max(7, Number(new URL(request.url).searchParams.get("days") || 28)));
  const [searchConsole, conversions] = await Promise.all([getSearchConsoleReport(days), getConversionReport()]);
  return NextResponse.json({ days, searchConsole, conversions, generatedAt: new Date().toISOString() }, { headers: { "Cache-Control": "private, no-store" } });
}
