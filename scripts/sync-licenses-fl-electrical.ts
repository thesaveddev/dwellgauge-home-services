import { readFile, rename, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { validateLicenseRecords } from "./lib/license-validation";

type Row = Record<string, string>;
type Config = {
  source: string;
  homepage: string;
  headerAliases: Record<string, string[]>;
  licensePrefixes: string[];
  activeStatusValues: string[];
  maxRecords: number;
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field.trim()); field = ""; }
    else if (c === "\n") { row.push(field.trim()); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field.trim()); rows.push(row); }
  return rows.filter((r) => r.some(Boolean));
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

function rowsFromCsv(text: string): Row[] {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const headers = rows[0].map((value) => value.toLowerCase().trim());
  const hasHeader = headers.some((value) => ["license number", "license no", "credential number", "licensee name"].includes(value));
  if (hasHeader) return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, i) => [header, values[i] ?? ""])));
  return rows.map((values) => Object.fromEntries(values.map((value, i) => [`column${i + 1}`, value])));
}

function field(config: Config, name: string, headers: string[]): string | undefined {
  const aliases = (config.headerAliases[name] ?? []).map(normalize);
  return headers.find((header) => aliases.includes(normalize(header)));
}

function date(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  const candidate = match ? `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}` : value.trim();
  return Number.isNaN(Date.parse(candidate)) ? undefined : new Date(candidate).toISOString().slice(0, 10);
}

function city(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.replace(/\s+[A-Z]{2}\s+\d{5}(?:-\d{4})?$/i, "").replace(/,\s*$/, "").trim() || undefined;
}

async function main() {
  const config = JSON.parse(await readFile(join(process.cwd(), "data", "sources", "licenses-fl-electrical.json"), "utf8")) as Config;
  const file = process.env.FL_ELECTRICAL_DATA_FILE || join(process.cwd(), "Data files", "electrical-license-data.csv");
  if ((await stat(file)).size === 0) throw new Error(`Electrical source file is empty: ${file}`);
  const rows = rowsFromCsv(await readFile(file, "utf8"));
  if (!rows.length) throw new Error(`No electrical records found in ${file}`);
  const headers = Object.keys(rows[0]);
  const headerless = headers.every((value) => value.startsWith("column"));
  const columns = headerless
    ? { licenseNumber: "column1", businessName: "column2", classification: "column3", status: "column4", issuedAt: "column5", expiresAt: "column6", city: "column7", county: "column8" }
    : { licenseNumber: field(config, "licenseNumber", headers), businessName: field(config, "businessName", headers), classification: field(config, "classification", headers), status: field(config, "status", headers), issuedAt: field(config, "issuedAt", headers), expiresAt: field(config, "expiresAt", headers), city: field(config, "city", headers), county: field(config, "county", headers) };
  if (!columns.licenseNumber || !columns.businessName) throw new Error(`Could not map required electrical columns: ${headers.join(", ")}`);
  const seen = new Set<string>();
  const records = [];
  for (const row of rows) {
    const licenseNumber = row[columns.licenseNumber].trim();
    const businessName = row[columns.businessName].trim();
    if (!licenseNumber || !businessName || seen.has(normalize(licenseNumber))) continue;
    if (!config.licensePrefixes.some((prefix) => normalize(licenseNumber).startsWith(normalize(prefix)))) continue;
    seen.add(normalize(licenseNumber));
    const rawStatus = columns.status ? row[columns.status].trim().toLowerCase() : "";
    const active = config.activeStatusValues.some((value) => rawStatus === value || rawStatus.includes(value)) || rawStatus === "a";
    records.push({ id: `fl-${normalize(licenseNumber)}`, stateCode: "FL", licenseNumber, businessName, trade: "electrical", classification: columns.classification ? row[columns.classification] || undefined : undefined, status: active ? "active" : rawStatus === "i" || rawStatus === "inactive" ? "inactive" : "unknown", issuedAt: columns.issuedAt ? date(row[columns.issuedAt]) : undefined, expiresAt: columns.expiresAt ? date(row[columns.expiresAt]) : undefined, city: columns.city ? city(row[columns.city]) : undefined, county: columns.county ? row[columns.county] || undefined : undefined, sample: false });
    if (records.length >= config.maxRecords) break;
  }
  const validation = validateLicenseRecords(records, "FL");
  if (!validation.valid) throw new Error(`Electrical dataset validation failed: ${validation.errors.join(" ")}`);
  const target = join(process.cwd(), "data", "licenses", "fl-electrical.json");
  const temp = `${target}.tmp`;
  await writeFile(temp, JSON.stringify({ meta: { source: config.source, sourceUrls: [config.homepage, file], retrievedAt: new Date().toISOString(), count: records.length }, records }, null, 2));
  await rename(temp, target);
  console.log(`Validated and wrote ${records.length} Florida electrical records.`);
}

main().catch((error) => { console.error("[licenses-fl-electrical] FAILED; existing data left untouched.", error instanceof Error ? error.message : error); process.exitCode = 1; });
