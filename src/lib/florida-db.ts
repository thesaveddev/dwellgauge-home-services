import type { LicenseRecord } from "./datasets";
import { createPool } from "./db";
import type { Pool } from "pg";

const COLUMNS = `id, state_code as "stateCode", license_number as "licenseNumber", business_name as "businessName", trade, classification, status, issued_at as "issuedAt", expires_at as "expiresAt", city, county, bonded, insured, complaints, sample`;

let sharedPool: Pool | null = null;
function pool(): Pool {
  if (!sharedPool) sharedPool = createPool(10);
  return sharedPool;
}

function whereClause(opts: { q?: string; state?: string; trade?: string }): { where: string[]; values: unknown[] } {
  const values: unknown[] = ["FL"];
  const where = ["state_code = $1"];
  if (opts.trade) { values.push(opts.trade.toLowerCase()); where.push(`trade = $${values.length}`); }
  if (opts.q) { values.push(`%${opts.q.trim()}%`); where.push(`(business_name ilike $${values.length} or license_number ilike $${values.length} or city ilike $${values.length})`); }
  return { where, values };
}

export async function searchFloridaLicensesDb(opts: { q?: string; state?: string; trade?: string }): Promise<LicenseRecord[]> {
  if (!process.env.DATABASE_URL) return [];
  const { where, values } = whereClause(opts);
  const result = await pool().query(`select ${COLUMNS} from licenses where ${where.join(" and ")} order by business_name asc limit 200`, values);
  return result.rows as LicenseRecord[];
}

export async function countFloridaLicensesDb(opts: { q?: string; state?: string; trade?: string }): Promise<number> {
  if (!process.env.DATABASE_URL) return 0;
  const { where, values } = whereClause(opts);
  const result = await pool().query(`select count(*)::int as n from licenses where ${where.join(" and ")}`, values);
  return (result.rows[0]?.n as number | undefined) ?? 0;
}

export async function getFloridaLicenseDb(id: string): Promise<LicenseRecord | undefined> {
  if (!process.env.DATABASE_URL) return undefined;
  const result = await pool().query(`select ${COLUMNS} from licenses where id=$1 and state_code='FL' limit 1`, [id]);
  return result.rows[0] as LicenseRecord | undefined;
}

export async function postgresLicenseStateCounts(): Promise<Array<{ code: string; count: number }>> {
  if (!process.env.DATABASE_URL) return [];
  const result = await pool().query(`select state_code as code, count(*)::int as count from licenses group by state_code order by state_code`);
  return result.rows as Array<{ code: string; count: number }>;
}

export async function listFloridaLicenseIds(limit: number): Promise<string[]> {
  if (!process.env.DATABASE_URL) return [];
  const result = await pool().query(`select id from licenses where state_code='FL' order by id limit $1`, [limit]);
  return result.rows.map((row) => row.id as string);
}
