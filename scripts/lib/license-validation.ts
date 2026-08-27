export interface LicenseValidationResult { valid: boolean; errors: string[]; warnings: string[]; count: number; }

export function validateLicenseRecords(records: unknown[], expectedState: string): LicenseValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();
  for (const [index, item] of records.entries()) {
    if (!item || typeof item !== "object") { errors.push(`Record ${index + 1} is not an object.`); continue; }
    const row = item as Record<string, unknown>;
    for (const field of ["id", "licenseNumber", "businessName", "trade"]) if (typeof row[field] !== "string" || !row[field]) errors.push(`Record ${index + 1} is missing ${field}.`);
    if (row.stateCode !== expectedState) errors.push(`Record ${index + 1} has unexpected state code.`);
    const key = String(row.licenseNumber || "").toLowerCase();
    if (key && seen.has(key)) errors.push(`Duplicate license number: ${key}.`);
    if (key) seen.add(key);
    if (row.sample === true) errors.push(`Record ${index + 1} is marked sample.`);
    if (row.status === "unknown") warnings.push(`Record ${index + 1} has unknown status.`);
  }
  if (!records.length) errors.push("Dataset contains no records.");
  return { valid: errors.length === 0, errors: errors.slice(0, 20), warnings: warnings.slice(0, 20), count: records.length };
}
