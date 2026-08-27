import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { StateSourceConfig } from "./lib/state-license-adapter";

type Registry = { states: StateSourceConfig[] };

async function main() {
  const registry = JSON.parse(await readFile(join(process.cwd(), "data", "sources", "licenses-states.json"), "utf8")) as Registry;
  const errors: string[] = [];
  for (const state of registry.states) {
    if (!/^[A-Z]{2}$/.test(state.code)) errors.push(`Invalid state code: ${state.code}`);
    if (!state.authority || !state.authorityUrl || !state.termsUrl || !state.cadence) errors.push(`${state.code} is missing source metadata.`);
    if (state.status === "live") {
      if (state.adapter === "pending-authorized-feed") errors.push(`${state.code} is marked live without an adapter.`);
      if (state.code !== "FL") errors.push(`${state.code} must not be marked live until its adapter and dataset are reviewed.`);
    }
  }
  if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
  else console.log(`[state-sources] PASS: ${registry.states.length} states registered; ${registry.states.filter((state) => state.status === "live").length} live.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
