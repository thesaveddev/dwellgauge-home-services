import { NextResponse } from "next/server";
import { listServices, listMetros, countLicensesAsync } from "@/lib/datasets";
import { assertProductionConfig } from "@/lib/config";
export const dynamic = "force-dynamic";
export async function GET() { try { assertProductionConfig(); return NextResponse.json({ ok: true, storage: process.env.DATABASE_URL ? "postgres" : "json-dev-only", serviceCount: listServices().length, metroCount: listMetros().length, licenseCount: await countLicensesAsync({}), timestamp: new Date().toISOString() }); } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Configuration incomplete" }, { status: 503 }); } }
