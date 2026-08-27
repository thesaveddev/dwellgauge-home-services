import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateLicenseRecords } from "./lib/license-validation";
import { validateEstimates, validatePermitObservations, validateWageRatios } from "./lib/data-quality";

const root = process.cwd();
const errors: string[] = [];
const warnings: string[] = [];

function json<T>(file: string): T | null {
  try { return JSON.parse(readFileSync(join(root, file), "utf8")) as T; } catch { return null; }
}
function requireEnv(name: string) { if (!process.env[name]) errors.push(`Missing production secret/config: ${name}`); }

const florida = json<{ records?: unknown[]; meta?: { source?: string; retrievedAt?: string } }>("data/licenses/fl.json");
if (!florida?.records?.length) errors.push("Florida official license dataset is missing or empty.");
else {
  const result = validateLicenseRecords(florida.records, "FL");
  if (!result.valid) errors.push(`Florida dataset failed validation: ${result.errors.join(" ")}`);
  if (!florida.meta?.source || florida.meta.source.toLowerCase().includes("sample")) errors.push("Florida dataset source metadata is not official.");
  if (!florida.meta?.retrievedAt || Number.isNaN(Date.parse(florida.meta.retrievedAt))) errors.push("Florida dataset has no valid retrieval timestamp.");
}

const estimates = json<unknown[]>("data/generated/cost-estimates.json");
if (!estimates) errors.push("Generated cost estimates are missing.");
else { const result = validateEstimates(estimates, 100); if (!result.valid) errors.push(`Cost estimates failed validation: ${result.errors.join(" ")}`); }
const wages = json<{ ratios?: Record<string, number> }>("data/generated/wage-ratios.json");
if (!wages?.ratios || !Object.keys(wages.ratios).length) warnings.push("Wage ratios are not populated; configure the official BLS pipeline before relying on local wage adjustments.");
else { const result = validateWageRatios(wages.ratios); if (!result.valid) errors.push(`Wage ratios failed validation: ${result.errors.join(" ")}`); }
const permits = json<{ observations?: unknown[] }>("data/generated/permit-observations.json");
if (!permits?.observations?.length) warnings.push("Permit observations are not populated; configure an official jurisdiction source before publishing permit claims.");
else { const result = validatePermitObservations(permits.observations); if (!result.valid) errors.push(`Permit dataset failed validation: ${result.errors.join(" ")}`); }

if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_DEMO_MODE === "true") errors.push("NEXT_PUBLIC_DEMO_MODE must not be true in production.");
if (process.env.NODE_ENV === "production") {
  for (const name of ["NEXT_PUBLIC_SITE_URL", "DATABASE_URL", "AUTH_SECRET", "ADMIN_PASSWORD", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_FEATURED_PRICE_ID"]) requireEnv(name);
}

for (const warning of warnings) console.warn(`[launch] WARNING: ${warning}`);
if (errors.length) { for (const error of errors) console.error(`[launch] ERROR: ${error}`); process.exitCode = 1; }
else console.log(`[launch] PASS: production prerequisites look healthy${warnings.length ? ` (${warnings.length} warning${warnings.length === 1 ? "" : "s"})` : ""}.`);
