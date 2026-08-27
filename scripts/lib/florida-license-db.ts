import type { LicenseRecord } from "../../src/lib/datasets";

export async function postgresLicenseSearch(opts: { q?: string; state?: string; trade?: string }): Promise<LicenseRecord[]> {
  if (!process.env.DATABASE_URL) return [];
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  try {
    const values: unknown[] = ["FL"];
    const where = ["state_code = $1"];
    if (opts.trade) { values.push(opts.trade.toLowerCase()); where.push(`trade = $${values.length}`); }
    if (opts.q) { values.push(`%${opts.q.trim()}%`); where.push(`(business_name ilike $${values.length} or license_number ilike $${values.length} or city ilike $${values.length})`); }
    const result = await pool.query(`select id, state_code as "stateCode", license_number as "licenseNumber", business_name as "businessName", trade, classification, status, issued_at as "issuedAt", expires_at as "expiresAt", city, county, bonded, insured, complaints, sample from licenses where ${where.join(" and ")} order by business_name asc limit 200`, values);
    return result.rows as LicenseRecord[];
  } finally { await pool.end(); }
}

export async function postgresLicenseById(id: string): Promise<LicenseRecord | undefined> {
  if (!process.env.DATABASE_URL) return undefined;
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  try { const result = await pool.query(`select id, state_code as "stateCode", license_number as "licenseNumber", business_name as "businessName", trade, classification, status, issued_at as "issuedAt", expires_at as "expiresAt", city, county, bonded, insured, complaints, sample from licenses where id=$1 and state_code='FL' limit 1`, [id]); return result.rows[0] as LicenseRecord | undefined; }
  finally { await pool.end(); }
}
