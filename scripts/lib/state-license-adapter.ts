import type { LicenseRecord } from "../../src/lib/datasets";
import { validateLicenseRecords, type LicenseValidationResult } from "./license-validation";

export interface StateSourceConfig {
  code: string;
  name: string;
  authority: string;
  authorityUrl: string;
  access: string;
  termsUrl: string;
  cadence: string;
  adapter: string;
  status: "live" | "planned";
}

export interface StateDataset<T extends LicenseRecord = LicenseRecord> {
  meta: {
    stateCode: string;
    source: string;
    sourceUrls: string[];
    retrievedAt: string;
    count: number;
    verificationSampleSize?: number;
    verificationReviewedAt?: string;
  };
  records: T[];
}

export function validateStateDataset(dataset: StateDataset, config: StateSourceConfig): LicenseValidationResult {
  if (config.status !== "live") return { valid: false, errors: [`${config.code} is not live; configure an authorized adapter before publishing.`], warnings: [], count: dataset.records?.length ?? 0 };
  if (dataset.meta.stateCode !== config.code) return { valid: false, errors: [`Dataset state ${dataset.meta.stateCode} does not match ${config.code}.`], warnings: [], count: dataset.records?.length ?? 0 };
  if (!dataset.meta.sourceUrls?.length || !dataset.meta.retrievedAt) return { valid: false, errors: ["Dataset is missing source traceability metadata."], warnings: [], count: dataset.records?.length ?? 0 };
  return validateLicenseRecords(dataset.records, config.code);
}
