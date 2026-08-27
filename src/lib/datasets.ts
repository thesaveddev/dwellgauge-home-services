import servicesData from "@/../data/services.json";
import metrosData from "@/../data/metros.json";
import licenseData from "@/../data/licenses/sample-seed.json";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DEMO_MODE } from "./site";
import { computeCostEstimate, type Benchmark } from "./compute";
import { buildLicenseIndex, queryLicenseIndex, type LicenseSearchIndex } from "./license-index";
import { searchFloridaLicensesDb, getFloridaLicenseDb, postgresLicenseStateCounts, countFloridaLicensesDb, listFloridaLicenseIds } from "./florida-db";

export interface SourceRef { label: string; url: string }
export interface Faq { q: string; a: string }
export interface Trade { slug: string; name: string; tagline: string; blsOccupation: string; blsOccupationName: string }
export interface Service { slug: string; name: string; tradeSlug: string; shortName: string; description: string; benchmark: Benchmark; laborShare: number; materialsShare: number; overheadShare: number; durationDays: string; permitTypical: boolean; climateSensitive: boolean; sources: SourceRef[]; faqs: Faq[] }
export interface Metro { slug: string; city: string; state: string; stateName: string; blsAreaCode: string; pre1980Share: number; climateModifier: number; materialsFactor: number; permitFees: Record<string, number> }
export interface LicenseRecord { id: string; stateCode: string; licenseNumber: string; businessName: string; trade: string; classification?: string; status: "active" | "inactive" | "expired" | "unknown"; issuedAt?: string; expiresAt?: string; county?: string; city?: string; bonded?: boolean; insured?: boolean; complaints?: number; sample?: boolean }
export interface StoredEstimate { serviceSlug: string; metroSlug: string; low: number; median: number; high: number; components: { label: string; amount: number }[]; adjustments: Record<string, number>; computedAt: string; inputsUsed: { wageRatio: number | null; permitActualAvg: number | null; permitSamples: number } }

const services = servicesData.services as Service[];
const trades = servicesData.trades as Trade[];
const metros = metrosData.metros as Metro[];

/**
 * Pipeline-generated files (data/generated/*) are read at request time so a
 * fresh checkout typechecks and builds before any pipeline has run. Missing
 * files simply fall back to computing estimates on the fly.
 */
function readGeneratedJson<T>(name: string): T | null {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "data", "generated", name), "utf8")) as T;
  } catch {
    return null;
  }
}

let storedEstimates: Map<string, StoredEstimate> | null = null;
function loadStoredEstimates(): Map<string, StoredEstimate> {
  if (storedEstimates) return storedEstimates;
  const map = new Map<string, StoredEstimate>();
  const rows = readGeneratedJson<StoredEstimate[]>("cost-estimates.json");
  if (Array.isArray(rows)) for (const row of rows) map.set(`${row.serviceSlug}::${row.metroSlug}`, row);
  storedEstimates = map;
  return map;
}

let wageRatios: Record<string, number> = {};
function loadWageRatios(): Record<string, number> {
  if (Object.keys(wageRatios).length) return wageRatios;
  const payload = readGeneratedJson<{ ratios?: Record<string, number> }>("wage-ratios.json");
  wageRatios = payload?.ratios ?? {};
  return wageRatios;
}

let licenseCache: LicenseRecord[] | null = null;
let licenseSearchIndex: LicenseSearchIndex | null = null;
function loadLicenses(): LicenseRecord[] {
  if (licenseCache) return licenseCache;
  const out: LicenseRecord[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("node:fs") as typeof import("node:fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("node:path") as typeof import("node:path");
    const dir = path.join(process.cwd(), "data", "licenses");
    for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) if (f.endsWith(".json") && (DEMO_MODE || f !== "sample-seed.json")) { const parsed = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); out.push(...((parsed.records ?? parsed) as LicenseRecord[])); }
  } catch {}
  licenseCache = out.length ? out : (DEMO_MODE ? (licenseData.records as LicenseRecord[]) : []);
  licenseSearchIndex = buildLicenseIndex(licenseCache);
  return licenseCache;
}
export function getTrade(slug: string) { return trades.find((t) => t.slug === slug); }
export function getService(slug: string) { return services.find((s) => s.slug === slug); }
export function getMetro(slug: string) { return metros.find((m) => m.slug === slug); }
export function listServices() { return services; }
export function listServicesByTrade(tradeSlug: string) { return services.filter((s) => s.tradeSlug === tradeSlug); }
export function listTrades() { return trades; }
export function listMetros() { return metros; }

export function latestEstimateDate(): string | null {
  const rows = readGeneratedJson<StoredEstimate[]>("cost-estimates.json") ?? [];
  const dates = rows
    .map((row) => row.computedAt)
    .filter((value): value is string => Boolean(value) && !Number.isNaN(Date.parse(value)))
    .sort((a, b) => Date.parse(b) - Date.parse(a));
  return dates[0] ?? null;
}

/** Estimate from the generated dataset when present, otherwise computed on the fly. */
export function getEstimate(serviceSlug: string, metroSlug: string) {
  const service = getService(serviceSlug)!; const metro = getMetro(metroSlug)!;
  const stored = loadStoredEstimates().get(`${serviceSlug}::${metroSlug}`) ?? null;
  if (stored) return { stored, estimate: { low: stored.low, median: stored.median, high: stored.high, components: stored.components, adjustments: { wageRatio: stored.inputsUsed.wageRatio ?? 1, materialsFactor: metro.materialsFactor, ageComplexity: Math.round(metro.pre1980Share * .12 * 100) / 100, climate: service.climateSensitive ? metro.climateModifier : 0, permitFee: stored.adjustments.permitFee ?? 0 } } };
  const wages = loadWageRatios(); const trade = getTrade(service.tradeSlug)!;
  const feeKey = service.tradeSlug === "painting" || service.tradeSlug === "hvac" ? "mechanical" : service.tradeSlug;
  const estimate = computeCostEstimate({ benchmark: service.benchmark, laborShare: service.laborShare, materialsShare: service.materialsShare, overheadShare: service.overheadShare, wageRatio: wages[`${metro.blsAreaCode}:${trade.blsOccupation}`] ?? 1, materialsFactor: metro.materialsFactor, pre1980Share: metro.pre1980Share, climateModifier: service.climateSensitive ? metro.climateModifier : 0, permitFee: service.permitTypical ? metro.permitFees[feeKey] ?? 0 : 0 });
  return { estimate, stored: null };
}
export function listEstimatesForService(serviceSlug: string) { const result = []; for (const metro of metros) { const { estimate } = getEstimate(serviceSlug, metro.slug); result.push({ metro, low: estimate.low, median: estimate.median, high: estimate.high }); } return result.sort((a, b) => a.median - b.median); }
export function searchLicenses(opts: { q?: string; state?: string; trade?: string }) {
  const records = loadLicenses();
  if (!licenseSearchIndex) licenseSearchIndex = buildLicenseIndex(records);
  return queryLicenseIndex(licenseSearchIndex, opts);
}
export function getLicense(id: string) {
  try {
    const records = loadLicenses();
    if (!licenseSearchIndex) licenseSearchIndex = buildLicenseIndex(records);
    return licenseSearchIndex.byId.get(decodeURIComponent(id));
  } catch { return undefined; }
}
export function licenseStates() { const counts = new Map<string, number>(); for (const r of loadLicenses()) counts.set(r.stateCode, (counts.get(r.stateCode) ?? 0) + 1); return [...counts.entries()].map(([code, count]) => ({ code, count })).sort(); }

function dbConfigured(): boolean { return Boolean(process.env.DATABASE_URL); }
function logFallback(context: string, error: unknown) { console.error(`[license] ${context} fell back to the JSON artifact`, error); }

/** Prefer PostgreSQL when configured; fall back to the validated JSON artifact otherwise. */
export async function searchLicensesAsync(opts: { q?: string; state?: string; trade?: string }): Promise<LicenseRecord[]> {
  if (dbConfigured()) { try { return await searchFloridaLicensesDb(opts); } catch (error) { logFallback("search", error); } }
  return searchLicenses(opts);
}

export async function countLicensesAsync(opts: { q?: string; state?: string; trade?: string }): Promise<number> {
  if (dbConfigured()) { try { return await countFloridaLicensesDb(opts); } catch (error) { logFallback("count", error); } }
  return searchLicenses(opts).length;
}

export async function getLicenseAsync(id: string): Promise<LicenseRecord | undefined> {
  if (dbConfigured()) { try { return await getFloridaLicenseDb(decodeURIComponent(id)); } catch (error) { logFallback("lookup", error); } }
  return getLicense(id);
}

export async function licenseStatesAsync(): Promise<Array<{ code: string; count: number }>> {
  if (dbConfigured()) { try { return await postgresLicenseStateCounts(); } catch (error) { logFallback("state counts", error); } }
  return licenseStates();
}

export async function listLicenseIdsAsync(limit: number): Promise<string[]> {
  if (dbConfigured()) { try { return await listFloridaLicenseIds(limit); } catch (error) { logFallback("sitemap ids", error); } }
  return searchLicenses({}).slice(0, limit).map((row) => row.id);
}
