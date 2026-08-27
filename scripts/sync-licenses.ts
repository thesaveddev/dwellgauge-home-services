import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
async function main() { const dir = join(process.cwd(), "data", "licenses"); await mkdir(dir, { recursive: true }); console.log(`License sync ready at ${dir}. Configure official state-board adapters before replacing sample-seed.json.`); await writeFile(join(dir, "SYNC-README.md"), "Replace sample-seed.json only with records obtained from official licensing authorities. Preserve source URLs, retrieval dates, and terms of use.\n"); }
main().catch(error => { console.error(error); process.exitCode = 1; });
