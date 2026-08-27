import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";

const occupations: Record<string, string> = {
  hvac: "499021",
  plumbing: "472152",
  electrical: "472111",
  roofing: "472181",
  painting: "472141",
};

const DEFAULT_METRO_URL = "https://www.bls.gov/oes/special.requests/oesm25ma.zip";
const DEFAULT_NATIONAL_URL = "https://www.bls.gov/oes/special.requests/oesm25nat.zip";
type Cell = string | number | null;
type TableRow = Record<string, string>;

function columnNumber(reference: string): number {
  const letters = /^([A-Z]+)/i.exec(reference)?.[1].toUpperCase() ?? "A";
  return [...letters].reduce((n, letter) => n * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function xmlText(value: string): string {
  return value.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").trim();
}

function sharedStrings(xml: string): string[] {
  return [...xml.matchAll(/<si[\s\S]*?<\/si>/g)].map((match) => [...match[0].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => xmlText(m[1])).join(""));
}

function xlsxMember(buffer: Uint8Array): Uint8Array {
  const files = unzipSync(buffer);
  const name = Object.keys(files).find((entry) => /\.xlsx$/i.test(entry));
  if (!name) throw new Error("BLS archive contains no XLSX member");
  return files[name];
}

function parseWorkbook(buffer: Uint8Array): TableRow[] {
  const files = unzipSync(buffer);
  const strings = files["xl/sharedStrings.xml"] ? sharedStrings(new TextDecoder().decode(files["xl/sharedStrings.xml"])) : [];
  const sheetName = Object.keys(files).find((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
  if (!sheetName) throw new Error("BLS workbook contains no worksheet");
  const xml = new TextDecoder().decode(files[sheetName]);
  const rawRows: Cell[][] = [...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
    const cells: Cell[] = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1];
      const ref = /\br="([A-Z]+\d+)"/i.exec(attrs)?.[1] ?? "A1";
      const type = /\bt="([^"]+)"/.exec(attrs)?.[1];
      const value = /<v>([\s\S]*?)<\/v>/.exec(cellMatch[2])?.[1] ?? "";
      let parsed: Cell = value;
      if (type === "s") parsed = strings[Number(value)] ?? "";
      else if (type === "inlineStr") parsed = xmlText(cellMatch[2]);
      cells[columnNumber(ref)] = String(parsed).trim();
    }
    return cells;
  });
  const headerIndex = rawRows.findIndex((row) => {
    const values = row.map((cell) => String(cell ?? "").trim().toUpperCase());
    return values.includes("OCC_CODE") && values.includes("A_MEDIAN");
  });
  if (headerIndex < 0) throw new Error("Could not find OCC_CODE/A_MEDIAN headers in BLS worksheet");
  const headers = rawRows[headerIndex].map((cell) => String(cell ?? "").trim());
  return rawRows.slice(headerIndex + 1).map((row) => Object.fromEntries(headers.map((header, index) => [header, String(row[index] ?? "").trim()]))).filter((row) => row.OCC_CODE);
}

function soc(value: string | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function numberValue(value: string | undefined): number | null {
  if (!value || ["*", "**", "#"].includes(value)) return null;
  const number = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : null;
}

async function download(url: string): Promise<Uint8Array> {
  if (url.startsWith("file:")) return new Uint8Array(await readFile(fileURLToPath(url)));
  const response = await fetch(url, { headers: { "user-agent": "DwellGaugeHomeServices/0.1 data-client", accept: "application/zip,application/octet-stream,*/*" } });
  if (!response.ok) throw new Error(`BLS download failed: HTTP ${response.status} for ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    const preview = new TextDecoder().decode(bytes.slice(0, 120)).replace(/\\s+/g, " ").trim();
    throw new Error(`BLS source returned ${response.headers.get("content-type") ?? "non-ZIP data"} instead of a ZIP archive: ${preview}`);
  }
  return bytes;
}

export async function fetchBlsWages(): Promise<Record<string, number>> {
  const metroUrl = process.env.BLS_OEWS_METRO_URL || DEFAULT_METRO_URL;
  const nationalUrl = process.env.BLS_OEWS_NATIONAL_URL || DEFAULT_NATIONAL_URL;
  const [metroArchive, nationalArchive] = await Promise.all([download(metroUrl), download(nationalUrl)]);
  const metroRows = parseWorkbook(xlsxMember(metroArchive));
  const nationalRows = parseWorkbook(xlsxMember(nationalArchive));
  const national = new Map<string, number>();
  for (const row of nationalRows) { const code = soc(row.OCC_CODE); const wage = numberValue(row.A_MEDIAN); if (code && wage) national.set(code, wage); }
  const output: Record<string, number> = {};
  const validOccupations = new Set(Object.values(occupations));
  for (const row of metroRows) {
    const code = soc(row.OCC_CODE);
    const area = (row.AREA ?? row.AREA_CODE ?? "").replace(/\D/g, "");
    const local = numberValue(row.A_MEDIAN);
    const baseline = national.get(code);
    if (!code || !area || !local || !baseline || !validOccupations.has(code)) continue;
    output[`${area}:${code}`] = Math.round((local / baseline) * 1000) / 1000;
  }
  if (!Object.keys(output).length) throw new Error("BLS files parsed but yielded no matching trade wage ratios");
  return output;
}
