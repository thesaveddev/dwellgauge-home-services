import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { validateLicenseRecords } from "../../../../../scripts/lib/license-validation";
import { createPool } from "@/lib/db";

export const dynamic = "force-dynamic";

function ageDays(retrievedAt?: string): number | null {
  if (!retrievedAt || Number.isNaN(Date.parse(retrievedAt))) return null;
  return Math.floor((Date.now() - Date.parse(retrievedAt)) / 86400000);
}

export async function GET() {
  if (process.env.DATABASE_URL) {
    try {
      const pool = createPool(1);
      try {
        const countResult = await pool.query(`select count(*)::int as n from licenses where state_code='FL'`);
        const importResult = await pool.query(`select source_url as "sourceUrl", retrieved_at as "retrievedAt", record_count as "recordCount", status from dataset_imports where dataset='licenses' and state_code='FL' order by imported_at desc limit 1`);
        const count = countResult.rows[0]?.n as number | undefined ?? 0;
        const latest = importResult.rows[0] as { sourceUrl?: string; retrievedAt?: string; recordCount?: number; status?: string } | undefined;
        if (!latest || latest.status !== "succeeded") {
          return NextResponse.json({ ok: false, state: "FL", storage: "postgres", available: false, message: "No successful Florida license import recorded." }, { status: 503 });
        }
        const retrievedAt = latest.retrievedAt;
        return NextResponse.json({ ok: true, state: "FL", storage: "postgres", available: true, count, retrievedAt, ageDays: ageDays(retrievedAt), source: latest.sourceUrl, validation: { valid: true, errors: [], warnings: [], count } });
      } finally { await pool.end(); }
    } catch (error) {
      return NextResponse.json({ ok: false, state: "FL", storage: "postgres", available: false, message: error instanceof Error ? error.message : "Postgres data check failed." }, { status: 503 });
    }
  }

  // Development fallback: the validated JSON artifact.
  const file = join(process.cwd(), "data", "licenses", "fl.json");
  if (!existsSync(file)) return NextResponse.json({ ok: false, state: "FL", storage: "json-dev-only", available: false, message: "No official Florida dataset has been installed." }, { status: 503 });
  try {
    const payload = JSON.parse(readFileSync(file, "utf8")) as { meta?: { retrievedAt?: string; source?: string; count?: number }; records?: unknown[] };
    const records = payload.records ?? [];
    const validation = validateLicenseRecords(records, "FL");
    const retrievedAt = payload.meta?.retrievedAt;
    return NextResponse.json({ ok: validation.valid, state: "FL", storage: "json-dev-only", available: true, count: records.length, retrievedAt, ageDays: ageDays(retrievedAt), source: payload.meta?.source, validation }, { status: validation.valid ? 200 : 503 });
  } catch { return NextResponse.json({ ok: false, state: "FL", storage: "json-dev-only", available: false, message: "Official dataset is unreadable." }, { status: 503 }); }
}
