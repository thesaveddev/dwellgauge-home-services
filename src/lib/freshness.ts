import { existsSync, readFileSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { validateLicenseRecords } from "../../scripts/lib/license-validation";

export type FreshnessStatus = "healthy" | "stale" | "missing" | "invalid";
export interface DatasetFreshness { name: string; status: FreshnessStatus; retrievedAt?: string; ageDays?: number; maxAgeDays: number; records?: number; source?: string; details?: string; }

function age(date?: string): number | undefined { if (!date || Number.isNaN(Date.parse(date))) return undefined; return Math.max(0, Math.floor((Date.now() - Date.parse(date)) / 86400000)); }
function status(ageDays: number | undefined, maxAgeDays: number, valid = true): FreshnessStatus { if (!valid) return "invalid"; if (ageDays === undefined) return "missing"; return ageDays > maxAgeDays ? "stale" : "healthy"; }
function fileAge(file: string): number | undefined { try { return Math.max(0, Math.floor((Date.now() - statSync(file).mtimeMs) / 86400000)); } catch { return undefined; } }

export function getDatasetFreshness(): DatasetFreshness[] {
  const root = join(process.cwd(), "data");
  const results: DatasetFreshness[] = [];
  const estimates = join(root, "generated", "cost-estimates.json");
  let estimateRows: Array<{ computedAt?: string }> = [];
  try { estimateRows = JSON.parse(readFileSync(estimates, "utf8")); } catch {}
  const latest = estimateRows.map((row) => row.computedAt).filter(Boolean).sort().at(-1);
  results.push({ name: "Cost estimates", status: status(age(latest), 45, estimateRows.length > 0), retrievedAt: latest, ageDays: age(latest), maxAgeDays: 45, records: estimateRows.length, details: "Generated service × metro estimates" });
  const wages = join(root, "generated", "wage-ratios.json");
  let wageMeta: { generatedAt?: string; source?: string; recordCount?: number } = {};
  try { wageMeta = JSON.parse(readFileSync(wages, "utf8")); } catch {}
  results.push({ name: "Wage ratios", status: status(age(wageMeta.generatedAt), 120, existsSync(wages) && wageMeta.source === "BLS OEWS"), retrievedAt: wageMeta.generatedAt, ageDays: age(wageMeta.generatedAt), maxAgeDays: 120, records: wageMeta.recordCount, source: wageMeta.source, details: "BLS OEWS-derived wage adjustments" });
  const permits = join(root, "generated", "permit-observations.json");
  let permitMeta: { generatedAt?: string; source?: string; recordCount?: number } = {};
  try { permitMeta = JSON.parse(readFileSync(permits, "utf8")); } catch {}
  results.push({ name: "Permit observations", status: status(age(permitMeta.generatedAt), 120, existsSync(permits) && Boolean(permitMeta.source)), retrievedAt: permitMeta.generatedAt, ageDays: age(permitMeta.generatedAt), maxAgeDays: 120, records: permitMeta.recordCount, source: permitMeta.source, details: "Validated official jurisdiction permit inputs" });
  let licenseFiles: string[] = [];
  try { licenseFiles = readdirSync(join(root, "licenses")).filter((file) => file.endsWith(".json") && file !== "sample-seed.json"); } catch {}
  if (!licenseFiles.length) results.push({ name: "Official license records", status: "missing", maxAgeDays: 45, details: "No official state datasets installed" });
  for (const file of licenseFiles) {
    const stateCode = file.slice(0, 2).toUpperCase();
    const licenseFile = join(root, "licenses", file);
    try {
      const payload = JSON.parse(readFileSync(licenseFile, "utf8")) as { meta?: { retrievedAt?: string; source?: string }; records?: unknown[] };
      const records = payload.records ?? [];
      const validation = validateLicenseRecords(records, stateCode);
      const retrievedAt = payload.meta?.retrievedAt;
      results.push({ name: `${stateCode} license records`, status: status(age(retrievedAt), 45, validation.valid), retrievedAt, ageDays: age(retrievedAt), maxAgeDays: 45, records: records.length, source: payload.meta?.source, details: validation.valid ? undefined : validation.errors.join(" ") });
    } catch { results.push({ name: `${stateCode} license records`, status: "invalid", maxAgeDays: 45, details: "Dataset could not be parsed" }); }
  }
  return results;
}
