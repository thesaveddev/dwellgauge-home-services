import { mkdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fetchBlsWages } from "./lib/bls";
import { validateWageRatios } from "./lib/data-quality";

async function main() {
  const result = await fetchBlsWages();
  const quality = validateWageRatios(result);
  if (!quality.valid) throw new Error(`Wage dataset quality gate failed: ${quality.errors.join(" ")}`);
  const dir = join(process.cwd(), "data", "generated");
  await mkdir(dir, { recursive: true });
  const target = join(dir, "wage-ratios.json");
  const temp = `${target}.tmp`;
  await writeFile(temp, JSON.stringify({ generatedAt: new Date().toISOString(), source: "BLS OEWS", sourceUrls: [process.env.BLS_OEWS_METRO_URL || "https://www.bls.gov/oes/special.requests/oesm25ma.zip", process.env.BLS_OEWS_NATIONAL_URL || "https://www.bls.gov/oes/special.requests/oesm25nat.zip"], recordCount: Object.keys(result).length, ratios: result }, null, 2));
  await rename(temp, target);
  console.log(`Wrote ${Object.keys(result).length} BLS metro wage ratios`);
}

main().catch((error) => {
  console.error("BLS wage refresh failed; existing wage-ratios.json was left untouched.", error);
  process.exitCode = 1;
});
