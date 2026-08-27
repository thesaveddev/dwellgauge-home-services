import { searchLicensesAsync, getLicenseAsync, countLicensesAsync, licenseStatesAsync, listLicenseIdsAsync } from "../src/lib/datasets";

async function main() {
  const started = Date.now();
  const total = await countLicensesAsync({});
  const hvac = await countLicensesAsync({ trade: "hvac" });
  const rows = await searchLicensesAsync({ q: "ACME" });
  const states = await licenseStatesAsync();
  const ids = await listLicenseIdsAsync(3);
  const first = rows[0] ?? (await searchLicensesAsync({}))[0];
  const byId = first ? await getLicenseAsync(first.id) : undefined;
  console.log(JSON.stringify({ total, hvac, acmeRows: rows.length, states, sampleIds: ids.length, lookup: byId ? { id: byId.id, licenseNumber: byId.licenseNumber, businessName: byId.businessName, trade: byId.trade } : null, elapsedMs: Date.now() - started }, null, 2));
}
main().catch((error) => { console.error("verification failed", error); process.exitCode = 1; });
