import { readFile } from "node:fs/promises";
import { join } from "node:path";
import servicesData from "../data/services.json";
import metrosData from "../data/metros.json";
import { validateEstimates, validatePermitObservations, validateWageRatios } from "./lib/data-quality";

async function readJson(name: string): Promise<unknown | null> { try { return JSON.parse(await readFile(join(process.cwd(), "data", "generated", name), "utf8")); } catch { return null; } }
function assert(name: string, quality: ReturnType<typeof validateEstimates>) { console.log(`${name}: ${quality.valid ? "PASS" : "FAIL"} (${quality.count} records)`); for (const message of quality.errors) console.error(`  ERROR: ${message}`); for (const message of quality.warnings) console.warn(`  WARN: ${message}`); if (!quality.valid) process.exitCode = 1; }

async function main() {
  // Wage ratios and permit observations are optional for pilot — warn but don't fail
  const wages = await readJson("wage-ratios.json") as { ratios?: unknown } | null;
  if (!wages?.ratios || (typeof wages.ratios === 'object' && Object.keys(wages.ratios).length === 0)) {
    console.log("Wage ratios: SKIP (not populated yet)");
  } else {
    assert("Wage ratios", validateWageRatios(wages.ratios));
  }
  const permits = await readJson("permit-observations.json") as { observations?: unknown } | null;
  const permitList = permits?.observations ?? [];
  if (!permitList.length) {
    console.log("Permit observations: SKIP (not populated yet)");
  } else {
    assert("Permit observations", validatePermitObservations(permitList));
  }
  const estimates = await readJson("cost-estimates.json");
  assert("Cost estimates", validateEstimates(estimates, servicesData.services.length * metrosData.metros.length));
  if (process.exitCode) throw new Error("Dataset quality validation failed.");
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
