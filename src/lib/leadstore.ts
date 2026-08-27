import fs from "node:fs";
import path from "node:path";
import { assertProductionConfig } from "./config";
import { createPool } from "./db";

export type LeadType = "quote" | "claim" | "subscribe";
export type LeadStatus = "new" | "routed" | "archived";

export interface Lead {
  id: string;
  type: LeadType;
  status: LeadStatus;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  serviceSlug?: string;
  metroSlug?: string;
  licenseRef?: string;
  landingPath?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  assignedContractor?: string;
  routedAt?: string;
  outcome?: "new" | "contacted" | "won" | "lost";
  revenueCents?: number;
  currency?: string;
  outcomeAt?: string;
  createdAt: string;
  consentAt?: string;
}

export type ClaimStatus = "pending" | "approved" | "rejected";

export interface Claim {
  id: string;
  licenseId: string;
  businessName: string;
  contactName: string;
  email: string;
  phone?: string;
  message?: string;
  status: ClaimStatus;
  createdAt: string;
  consentAt?: string;
}

export interface LeadStore {
  insertLead(lead: Lead): Promise<void>;
  listLeads(): Promise<Lead[]>;
  updateLeadStatus(id: string, status: LeadStatus): Promise<void>;
  updateLeadOutcome(id: string, input: { status?: LeadStatus; outcome?: Lead["outcome"]; assignedContractor?: string; revenueCents?: number; currency?: string }): Promise<void>;
  insertClaim(claim: Claim): Promise<void>;
  listClaims(): Promise<Claim[]>;
  updateClaimStatus(id: string, status: ClaimStatus): Promise<void>;
}

// ---------------- JSON file store (local dev) ----------------

class JsonLeadStore implements LeadStore {
  private file(kind: "leads" | "claims") {
    const dir = path.join(process.cwd(), "data", "runtime");
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, `${kind}.json`);
  }

  private read<T>(kind: "leads" | "claims"): T[] {
    try {
      return JSON.parse(fs.readFileSync(this.file(kind), "utf8"));
    } catch {
      return [];
    }
  }

  private write<T>(kind: "leads" | "claims", rows: T[]) {
    fs.writeFileSync(this.file(kind), JSON.stringify(rows, null, 2));
  }

  async insertLead(lead: Lead) {
    const rows = this.read<Lead>("leads");
    rows.unshift(lead);
    this.write("leads", rows);
  }

  async listLeads() {
    return this.read<Lead>("leads");
  }

  async updateLeadStatus(id: string, status: LeadStatus) {
    const rows = this.read<Lead>("leads").map((r) => (r.id === id ? { ...r, status, routedAt: status === "routed" ? new Date().toISOString() : r.routedAt } : r));
    this.write("leads", rows);
  }

  async updateLeadOutcome(id: string, input: { status?: LeadStatus; outcome?: Lead["outcome"]; assignedContractor?: string; revenueCents?: number; currency?: string }) {
    const rows = this.read<Lead>("leads").map((r) => r.id === id ? { ...r, ...input, outcomeAt: input.outcome ? new Date().toISOString() : r.outcomeAt, routedAt: input.status === "routed" ? new Date().toISOString() : r.routedAt } : r);
    this.write("leads", rows);
  }

  async insertClaim(claim: Claim) {
    const rows = this.read<Claim>("claims");
    rows.unshift(claim);
    this.write("claims", rows);
  }

  async listClaims() {
    return this.read<Claim>("claims");
  }

  async updateClaimStatus(id: string, status: ClaimStatus) {
    const rows = this.read<Claim>("claims").map((r) => (r.id === id ? { ...r, status } : r));
    this.write("claims", rows);
  }
}

// ---------------- Postgres store (production / Supabase) ----------------

class PgLeadStore implements LeadStore {
  private pool = createPool(5);

  async insertLead(lead: Lead) {
    await this.pool.query(
      `INSERT INTO leads (id, type, status, name, email, phone, message, service_slug, metro_slug, license_ref, landing_path, utm_source, utm_medium, utm_campaign, consent_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [lead.id, lead.type, lead.status, lead.name ?? null, lead.email ?? null, lead.phone ?? null,
       lead.message ?? null, lead.serviceSlug ?? null, lead.metroSlug ?? null, lead.licenseRef ?? null, lead.landingPath ?? null, lead.utmSource ?? null, lead.utmMedium ?? null, lead.utmCampaign ?? null, lead.consentAt ?? null, lead.createdAt]
    );
  }

  async listLeads() {
    const res = await this.pool.query(
      `SELECT id, type, status, name, email, phone, message,
              service_slug AS "serviceSlug", metro_slug AS "metroSlug",
              license_ref AS "licenseRef", landing_path AS "landingPath", utm_source AS "utmSource", utm_medium AS "utmMedium", utm_campaign AS "utmCampaign", assigned_contractor AS "assignedContractor", routed_at AS "routedAt", outcome, revenue_cents AS "revenueCents", currency, outcome_at AS "outcomeAt", consent_at AS "consentAt", created_at AS "createdAt"
       FROM leads ORDER BY created_at DESC LIMIT 500`
    );
    return res.rows as unknown as Lead[];
  }

  async updateLeadStatus(id: string, status: LeadStatus) {
    await this.pool.query(`UPDATE leads SET status = $2, routed_at = case when $2 = 'routed' then now() else routed_at end WHERE id = $1`, [id, status]);
  }

  async updateLeadOutcome(id: string, input: { status?: LeadStatus; outcome?: Lead["outcome"]; assignedContractor?: string; revenueCents?: number; currency?: string }) {
    await this.pool.query(`UPDATE leads SET status = coalesce($2,status), outcome = coalesce($3,outcome), assigned_contractor = coalesce($4,assigned_contractor), revenue_cents = coalesce($5,revenue_cents), currency = coalesce($6,currency), routed_at = case when $2 = 'routed' then now() else routed_at end, outcome_at = case when $3 is not null then now() else outcome_at end WHERE id = $1`, [id, input.status ?? null, input.outcome ?? null, input.assignedContractor ?? null, input.revenueCents ?? null, input.currency ?? null]);
  }

  async insertClaim(claim: Claim) {
    await this.pool.query(
      `INSERT INTO claims (id, license_id, business_name, contact_name, email, phone, message, status, consent_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [claim.id, claim.licenseId, claim.businessName, claim.contactName, claim.email,
       claim.phone ?? null, claim.message ?? null, claim.status, claim.consentAt ?? null, claim.createdAt]
    );
  }

  async listClaims() {
    const res = await this.pool.query(
      `SELECT id, license_id AS "licenseId", business_name AS "businessName",
              contact_name AS "contactName", email, phone, message, status, consent_at AS "consentAt", created_at AS "createdAt"
       FROM claims ORDER BY created_at DESC LIMIT 500`
    );
    return res.rows as unknown as Claim[];
  }

  async updateClaimStatus(id: string, status: ClaimStatus) {
    await this.pool.query(`UPDATE claims SET status = $2 WHERE id = $1`, [id, status]);
  }
}

let store: LeadStore | null = null;

export function getLeadStore(): LeadStore {
  if (!store) {
    assertProductionConfig();
    store = process.env.DATABASE_URL ? new PgLeadStore() : new JsonLeadStore();
  }
  return store;
}

export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
