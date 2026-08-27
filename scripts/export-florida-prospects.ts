import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

type RecordRow = { id: string; stateCode: string; licenseNumber: string; businessName: string; trade: string; status: string; issuedAt?: string; city?: string; county?: string };
const targetCities = new Set(["orlando", "tampa", "miami", "fort lauderdale", "jacksonville"]);
const targetTrades = new Set(["hvac", "roofing", "plumbing", "electrical"]);
const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

async function main() {
  const payload = JSON.parse(await readFile(join(process.cwd(), "data", "licenses", "fl.json"), "utf8")) as { records: RecordRow[] };
  const rows = payload.records.filter((record) => record.status === "active" && targetTrades.has(record.trade) && targetCities.has((record.city ?? "").trim().toLowerCase())).map((record) => [record.businessName, record.trade, record.licenseNumber, record.city, record.county, record.issuedAt, record.id, "", "", "", ""]);
  const header = ["business_name", "trade", "license_number", "city", "county", "issued_at", "profile_path", "website", "contact_email", "first_contacted_at", "outcome"];
  const file = join(process.cwd(), "data", "runtime", "florida-prospects.csv");
  await mkdir(join(process.cwd(), "data", "runtime"), { recursive: true });
  await writeFile(file, [header, ...rows].map((row) => row.map(escape).join(",")).join("\n") + "\n");
  console.log(`Exported ${rows.length} active Florida prospects to data/runtime/florida-prospects.csv.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
