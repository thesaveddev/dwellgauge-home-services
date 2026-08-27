import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { validateLicenseRecords } from "./lib/license-validation";

type License = { id: string; stateCode: string; licenseNumber: string; businessName: string; trade: string; classification?: string; status: "active" | "inactive" | "expired" | "unknown"; issuedAt?: string; expiresAt?: string; city?: string; county?: string; bonded?: boolean; insured?: boolean; complaints?: number; sample?: boolean };
type Payload = { meta?: { source?: string; sourceUrls?: string[]; retrievedAt?: string }; records?: License[] };

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const payload = JSON.parse(await readFile(join(process.cwd(), "data", "licenses", "fl-electrical.json"), "utf8")) as Payload;
  const records = payload.records ?? [];
  const validation = validateLicenseRecords(records, "FL");
  if (!validation.valid) throw new Error(`Florida electrical dataset validation failed: ${validation.errors.join(" ")}`);
  const sourceUrl = payload.meta?.sourceUrls?.[0];
  const retrievedAt = payload.meta?.retrievedAt;
  if (!payload.meta?.source || !sourceUrl || !retrievedAt) throw new Error("Florida electrical dataset is missing source metadata.");
  const { createPool } = await import("../src/lib/db");
  const pool = createPool(3);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const audit = await client.query("insert into dataset_imports (dataset, state_code, source_url, retrieved_at, record_count, status) values ($1,$2,$3,$4,$5,'started') returning id", ["licenses-electrical", "FL", sourceUrl, retrievedAt, records.length]);
    const importId = audit.rows[0].id;
    for (const record of records) {
      await client.query(`insert into licenses (id,state_code,license_number,business_name,trade,classification,status,issued_at,expires_at,city,county,bonded,insured,complaints,sample,source_url,retrieved_at)
        values ($1,'FL',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,false,$14,$15)
        on conflict (state_code,license_number) do update set id=excluded.id,business_name=excluded.business_name,trade=excluded.trade,classification=excluded.classification,status=excluded.status,issued_at=excluded.issued_at,expires_at=excluded.expires_at,city=excluded.city,county=excluded.county,bonded=excluded.bonded,insured=excluded.insured,complaints=excluded.complaints,source_url=excluded.source_url,retrieved_at=excluded.retrieved_at,updated_at=now()`, [record.id, record.licenseNumber, record.businessName, record.trade, record.classification ?? null, record.status, record.issuedAt ?? null, record.expiresAt ?? null, record.city ?? null, record.county ?? null, record.bonded ?? null, record.insured ?? null, record.complaints ?? null, sourceUrl, retrievedAt]);
    }
    await client.query("update dataset_imports set status='succeeded' where id=$1", [importId]);
    await client.query("COMMIT");
    console.log(`Imported ${records.length} Florida electrical records into PostgreSQL.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); await pool.end(); }
}
main().catch((error) => { console.error("Florida electrical Postgres import failed; transaction rolled back.", error instanceof Error ? error.message : error); process.exitCode = 1; });
