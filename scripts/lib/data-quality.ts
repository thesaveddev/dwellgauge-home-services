export type QualityResult = { valid: boolean; errors: string[]; warnings: string[]; count: number };

function result(errors: string[], warnings: string[], count: number): QualityResult { return { valid: errors.length === 0, errors: errors.slice(0, 25), warnings: warnings.slice(0, 25), count }; }

export function validateWageRatios(ratios: unknown, expectedAreas: string[] = []): QualityResult {
  const errors: string[] = [], warnings: string[] = [];
  if (!ratios || typeof ratios !== "object" || Array.isArray(ratios)) return result(["Wage ratios must be an object."], warnings, 0);
  const entries = Object.entries(ratios as Record<string, unknown>);
  if (!entries.length) errors.push("Wage ratio dataset is empty.");
  for (const [key, value] of entries) {
    const ratio = Number(value);
    if (!/^\d{5,6}:\d{6}$/.test(key)) errors.push(`Invalid wage ratio key: ${key}.`);
    if (!Number.isFinite(ratio) || ratio < 0.4 || ratio > 2.5) errors.push(`Out-of-range wage ratio for ${key}: ${String(value)}.`);
  }
  const areas = new Set(entries.map(([key]) => key.split(":")[0]));
  for (const area of expectedAreas) if (!areas.has(area)) warnings.push(`No wage ratio found for configured metro area ${area}.`);
  return result(errors, warnings, entries.length);
}

export function validatePermitObservations(observations: unknown, allowedTypes: string[] = []): QualityResult {
  const errors: string[] = [], warnings: string[] = [];
  if (!Array.isArray(observations)) return result(["Permit observations must be an array."], warnings, 0);
  if (!observations.length) errors.push("Permit observations are empty.");
  const seen = new Set<string>();
  for (const [index, item] of observations.entries()) {
    if (!item || typeof item !== "object") { errors.push(`Permit row ${index + 1} is not an object.`); continue; }
    const row = item as Record<string, unknown>;
    if (typeof row.jurisdiction !== "string" || !row.jurisdiction.trim()) errors.push(`Permit row ${index + 1} has no jurisdiction.`);
    if (typeof row.permitType !== "string" || !row.permitType.trim()) errors.push(`Permit row ${index + 1} has no permit type.`);
    if (allowedTypes.length && !allowedTypes.some((type) => String(row.permitType).toLowerCase().includes(type.toLowerCase()))) errors.push(`Permit row ${index + 1} has unsupported type.`);
    const amount = Number(row.amount);
    if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) errors.push(`Permit row ${index + 1} has invalid amount.`);
    if (typeof row.issuedAt !== "string" || Number.isNaN(Date.parse(row.issuedAt))) errors.push(`Permit row ${index + 1} has invalid issuedAt.`);
    const key = `${row.jurisdiction}|${row.permitType}|${row.issuedAt}|${row.amount}`;
    if (seen.has(key)) warnings.push(`Duplicate permit observation at row ${index + 1}.`);
    seen.add(key);
  }
  return result(errors, warnings, observations.length);
}

export function validateEstimates(rows: unknown, expectedCount: number): QualityResult {
  const errors: string[] = [], warnings: string[] = [];
  if (!Array.isArray(rows)) return result(["Cost estimates must be an array."], warnings, 0);
  if (rows.length !== expectedCount) errors.push(`Expected ${expectedCount} cost estimates but received ${rows.length}.`);
  const keys = new Set<string>();
  for (const [index, item] of rows.entries()) {
    if (!item || typeof item !== "object") { errors.push(`Estimate ${index + 1} is not an object.`); continue; }
    const row = item as Record<string, unknown>;
    for (const field of ["serviceSlug", "metroSlug", "computedAt"]) if (typeof row[field] !== "string" || !row[field]) errors.push(`Estimate ${index + 1} is missing ${field}.`);
    for (const field of ["low", "median", "high"]) { const value = Number(row[field]); if (!Number.isFinite(value) || value <= 0) errors.push(`Estimate ${index + 1} has invalid ${field}.`); }
    if (Number(row.low) > Number(row.median) || Number(row.median) > Number(row.high)) errors.push(`Estimate ${index + 1} range is not ordered.`);
    const key = `${row.serviceSlug}|${row.metroSlug}`; if (keys.has(key)) errors.push(`Duplicate estimate key: ${key}.`); keys.add(key);
  }
  return result(errors, warnings, rows.length);
}
