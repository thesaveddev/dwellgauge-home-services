import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import servicesData from "../data/services.json";
import metrosData from "../data/metros.json";
import { computeCostEstimate } from "../src/lib/compute";
import { validateEstimates } from "./lib/data-quality";

async function main() {
  let ratios: Record<string, number> = {};
  try { ratios = (JSON.parse(await readFile(join(process.cwd(), "data", "generated", "wage-ratios.json"), "utf8")) as { ratios?: Record<string, number> }).ratios ?? {}; } catch { console.warn("No wage-ratios.json found; using baseline wage ratios."); }
  const trades = servicesData.trades as Array<{ slug: string; blsOccupation: string }>;
  const rows = [];
  for (const service of servicesData.services as any[]) for (const metro of metrosData.metros as any[]) {
    const trade = trades.find((item) => item.slug === service.tradeSlug);
    const wageRatio = trade ? ratios[`${metro.blsAreaCode}:${trade.blsOccupation}`] ?? 1 : 1;
    const estimate = computeCostEstimate({ benchmark: service.benchmark, laborShare: service.laborShare, materialsShare: service.materialsShare, overheadShare: service.overheadShare, wageRatio, materialsFactor: metro.materialsFactor, pre1980Share: metro.pre1980Share, climateModifier: service.climateSensitive ? metro.climateModifier : 0, permitFee: service.permitTypical ? (metro.permitFees[service.tradeSlug === "hvac" ? "mechanical" : service.tradeSlug] ?? 0) : 0 });
    rows.push({ serviceSlug: service.slug, metroSlug: metro.slug, ...estimate, computedAt: new Date().toISOString(), inputsUsed: { wageRatio, permitActualAvg: null, permitSamples: 0 } });
  }
  const quality = validateEstimates(rows, (servicesData.services as unknown[]).length * (metrosData.metros as unknown[]).length);
  if (!quality.valid) throw new Error(`Cost estimate quality gate failed: ${quality.errors.join(" ")}`);
  const dir = join(process.cwd(), "data", "generated");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "cost-estimates.json"), JSON.stringify(rows, null, 2));
  console.log(`Wrote ${rows.length} estimates using ${Object.keys(ratios).length} wage ratios`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
