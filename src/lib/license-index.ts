import type { LicenseRecord } from "./datasets";

export interface LicenseSearchIndex {
  all: LicenseRecord[];
  byId: Map<string, LicenseRecord>;
  byLicense: Map<string, LicenseRecord>;
}

const normalize = (value: string) => value.trim().toLowerCase();

export function buildLicenseIndex(records: LicenseRecord[]): LicenseSearchIndex {
  const byId = new Map<string, LicenseRecord>();
  const byLicense = new Map<string, LicenseRecord>();
  for (const record of records) {
    byId.set(record.id, record);
    byLicense.set(normalize(record.licenseNumber), record);
  }
  return { all: records, byId, byLicense };
}

export function queryLicenseIndex(index: LicenseSearchIndex, opts: { q?: string; state?: string; trade?: string }): LicenseRecord[] {
  const state = opts.state?.toUpperCase();
  const trade = opts.trade?.toLowerCase();
  const q = opts.q ? normalize(opts.q) : "";
  const exact = q ? index.byLicense.get(q) : undefined;
  const candidates = exact ? [exact] : index.all;
  return candidates.filter((record) => {
    if (state && record.stateCode !== state) return false;
    if (trade && record.trade !== trade) return false;
    if (!q) return true;
    return [record.businessName, record.licenseNumber, record.city ?? ""].some((value) => normalize(value).includes(q));
  });
}
