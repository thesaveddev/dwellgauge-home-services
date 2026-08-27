// Contractor profile store.
//
// Profile content is the marketing layer a contractor controls after an approved
// claim. It is stored in `contractor_profiles` and joined to license facts at
// read time. Public-record fields always come from the license record; profile
// fields are handled as editable business content and displayed separately.
//
// When PostgreSQL is not configured (local dev before setup), we fall back to a
// deterministic profile derived from the license record so the profile pages
// render everywhere.

import type { Pool } from "pg";
import type { LicenseRecord } from "./datasets";
import { hasDatabase, createPool } from "./db";
import { getActiveSubscription } from "./billing-store";

export interface ContractorProfile {
  licenseId: string;
  status: "claimed" | "approved" | "live";
  tagline: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  serviceAreas: string[];
  servicesOffered: string[];
  hours: string | null;
  about: string | null;
  verified: boolean;
  featured: boolean;
  billingCustomerId: string | null;
}

let pool: Pool | null = null;
function getPool(): Pool | null {
  if (!hasDatabase()) return null;
  if (!pool) pool = createPool();
  return pool;
}

/**
 * Build a safe deterministic profile for a record with no stored profile yet.
 * License facts only — the base every contractor starts from.
 */
export function baseProfile(record: LicenseRecord): ContractorProfile {
  return {
    licenseId: record.id,
    status: "claimed",
    tagline: null,
    website: null,
    email: null,
    phone: null,
    serviceAreas: record.city ? [record.city] : [],
    servicesOffered: [record.trade],
    hours: null,
    about: null,
    verified: false,
    featured: false,
    billingCustomerId: null,
  };
}

interface ProfileRow {
  license_id: string;
  status: string;
  tagline: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  service_areas: string[] | null;
  services_offered: string[] | null;
  hours: string | null;
  about: string | null;
  verified: boolean;
  featured: boolean;
  billing_customer_id: string | null;
}

function mapRow(row: ProfileRow): ContractorProfile {
  return {
    licenseId: row.license_id,
    status: (row.status === "approved" || row.status === "live" ? row.status : "claimed"),
    tagline: row.tagline,
    website: row.website,
    email: row.email,
    phone: row.phone,
    serviceAreas: row.service_areas ?? [],
    servicesOffered: row.services_offered ?? [],
    hours: row.hours,
    about: row.about,
    verified: Boolean(row.verified),
    featured: Boolean(row.featured),
    billingCustomerId: row.billing_customer_id ?? null,
  };
}

const CACHE_TTL_MS = 30_000;
const profileCache = new Map<string, { at: number; value: ContractorProfile | null }>();

export function clearProfileCache() {
  profileCache.clear();
}

/**
 * Returns the stored profile for a record, or null when the contractor has not
 * claimed yet (the page falls back to baseProfile). Pulls from PostgreSQL when
 * configured; otherwise matches a tiny in-memory override map only used in dev.
 */
export async function getProfile(record: LicenseRecord): Promise<ContractorProfile | null> {
  const db = getPool();
  if (!db) return null;

  const cached = profileCache.get(record.id);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  try {
    const { rows } = await db.query<ProfileRow>(
      `select license_id, status, tagline, website, email, phone,
              service_areas, services_offered, hours, about, verified, featured,
              billing_customer_id
         from contractor_profiles
        where license_id = $1
        limit 1`,
      [record.id],
    );
    const value = rows.length ? mapRow(rows[0]) : null;
    if (value?.billingCustomerId) {
      const subscription = await getActiveSubscription(value.billingCustomerId);
      value.featured = Boolean(subscription);
    }
    profileCache.set(record.id, { at: Date.now(), value });
    return value;
  } catch (error) {
    console.error("[profiles] lookup failed", error);
    return null;
  }
}

/** True when the record should display as a featured premium profile. */
export function isFeatured(profile: ContractorProfile | null, record: LicenseRecord): boolean {
  if (!profile) return false;
  return profile.status === "live" || profile.featured;
}