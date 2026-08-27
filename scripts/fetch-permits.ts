import { mkdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { validatePermitObservations } from "./lib/data-quality";

const rowSchema = z.record(z.string(), z.unknown());
const configSchema = z.object({ url: z.string().url(), source: z.string().min(1), jurisdictionField: z.string().min(1), dateField: z.string().min(1), typeField: z.string().min(1), amountField: z.string().min(1), allowedTypes: z.array(z.string()).min(1) });

function numberValue(value: unknown): number | null { const parsed = Number(String(value ?? "").replace(/[$,]/g, "")); return Number.isFinite(parsed) && parsed >= 0 ? parsed : null; }
function dateValue(value: unknown): string | null { const date = new Date(String(value ?? "")); return Number.isNaN(date.getTime()) ? null : date.toISOString(); }

async function main() {
  const url = process.env.PERMITS_SOCRATA_URL;
  const config = process.env.PERMITS_SOURCE_CONFIG ? configSchema.parse(JSON.parse(process.env.PERMITS_SOURCE_CONFIG)) : null;
  if (!url || !config) { console.warn("No PERMITS_SOCRATA_URL and PERMITS_SOURCE_CONFIG configured; preserving existing permit observations."); return; }
  if (config.url !== url) throw new Error("PERMITS_SOCRATA_URL must match the verified URL in PERMITS_SOURCE_CONFIG");
  const response = await fetch(`${url}${url.includes("?") ? "&" : "?"}$limit=50000`, { headers: { accept: "application/json", "user-agent": "DwellGaugeHomeServices/0.1 data-client" } });
  if (!response.ok) throw new Error(`Permit source failed: HTTP ${response.status}`);
  const raw = await response.json() as unknown;
  if (!Array.isArray(raw)) throw new Error("Permit source did not return a JSON array");
  const observations = raw.flatMap((value) => { const parsed = rowSchema.safeParse(value); if (!parsed.success) return []; const row = parsed.data; const type = String(row[config.typeField] ?? ""); const amount = numberValue(row[config.amountField]); const date = dateValue(row[config.dateField]); const jurisdiction = String(row[config.jurisdictionField] ?? "").trim(); if (!jurisdiction || !date || amount === null || !config.allowedTypes.some((allowed) => type.toLowerCase().includes(allowed.toLowerCase()))) return []; return [{ jurisdiction, permitType: type, amount, issuedAt: date }]; });
  if (!observations.length) throw new Error("Permit source returned no valid observations matching the verified field mappings");
  const quality = validatePermitObservations(observations, config.allowedTypes);
  if (!quality.valid) throw new Error(`Permit dataset quality gate failed: ${quality.errors.join(" ")}`);
  const dir = join(process.cwd(), "data", "generated"); await mkdir(dir, { recursive: true }); const target = join(dir, "permit-observations.json"); const temp = `${target}.tmp`;
  await writeFile(temp, JSON.stringify({ generatedAt: new Date().toISOString(), source: config.source, sourceUrl: url, recordCount: observations.length, observations }, null, 2)); await rename(temp, target); console.log(`Validated and wrote ${observations.length} permit observations from ${config.source}`);
}
main().catch((error) => { console.error("Permit refresh failed; existing observations were left untouched.", error instanceof Error ? error.message : error); process.exitCode = 1; });
