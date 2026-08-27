import { getLeadStore, type Lead, type Claim } from "./leadstore";

export interface SearchConsoleRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

export interface SearchConsoleReport {
  available: boolean;
  reason?: string;
  rows: SearchConsoleRow[];
  totals: { clicks: number; impressions: number; ctr: number; position: number };
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function dateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getSearchConsoleReport(days = 28): Promise<SearchConsoleReport> {
  const siteUrl = process.env.GSC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  const serviceAccount = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!siteUrl || !serviceAccount) {
    return { available: false, reason: "Configure GSC_SITE_URL and GSC_SERVICE_ACCOUNT_JSON.", rows: [], totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 } };
  }

  try {
    const credentials = JSON.parse(serviceAccount) as { client_email?: string; private_key?: string };
    if (!credentials.client_email || !credentials.private_key) throw new Error("Invalid service-account credentials.");
    const token = await getGoogleAccessToken(credentials.client_email, credentials.private_key);
    const response = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: dateString(new Date(Date.now() - days * 86400000)),
        endDate: dateString(new Date(Date.now() - 86400000)),
        dimensions: ["query"],
        rowLimit: 250,
        dataState: "final",
      }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Search Console returned HTTP ${response.status}.`);
    const payload = (await response.json()) as { rows?: SearchConsoleRow[] };
    const rows = payload.rows ?? [];
    const clicks = rows.reduce((sum, row) => sum + asNumber(row.clicks), 0);
    const impressions = rows.reduce((sum, row) => sum + asNumber(row.impressions), 0);
    const positionWeighted = rows.reduce((sum, row) => sum + asNumber(row.position) * asNumber(row.impressions), 0);
    return { available: true, rows, totals: { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: impressions ? positionWeighted / impressions : 0 } };
  } catch (error) {
    return { available: false, reason: error instanceof Error ? error.message : "Search Console request failed.", rows: [], totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 } };
  }
}

async function getGoogleAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const jwt = await import("node:crypto");
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(JSON.stringify({ iss: clientEmail, scope: "https://www.googleapis.com/auth/webmasters.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })).toString("base64url");
  const unsigned = `${header}.${claim}`;
  const signer = jwt.createSign("RSA-SHA256");
  signer.update(unsigned);
  const assertion = `${unsigned}.${signer.sign(privateKey.replace(/\\n/g, "\n"), "base64url")}`;
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
  if (!response.ok) throw new Error(`Google authentication returned HTTP ${response.status}.`);
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Google authentication returned no access token.");
  return data.access_token;
}

export interface ConversionReport {
  leads: number;
  quoteLeads: number;
  claims: number;
  newLeads: number;
  routedLeads: number;
  quoteRate: number;
  byService: Array<{ service: string; count: number }>;
  byMetro: Array<{ metro: string; count: number }>;
  revenueCents: number;
  wonLeads: number;
  byPage: Array<{ page: string; leads: number; won: number; revenueCents: number }>;
}

export async function getConversionReport(): Promise<ConversionReport> {
  const store = getLeadStore();
  const [leads, claims] = await Promise.all([store.listLeads(), store.listClaims()]);
  const quoteLeads = leads.filter((lead) => lead.type === "quote");
  const serviceCounts = countBy(quoteLeads, (lead) => lead.serviceSlug || "General inquiry");
  const metroCounts = countBy(quoteLeads, (lead) => lead.metroSlug || "Not specified");
  const pageMap = new Map<string, { leads: number; won: number; revenueCents: number }>();
  for (const lead of quoteLeads) { const page = lead.landingPath || "Unknown page"; const current = pageMap.get(page) ?? { leads: 0, won: 0, revenueCents: 0 }; current.leads += 1; if (lead.outcome === "won") current.won += 1; current.revenueCents += lead.revenueCents ?? 0; pageMap.set(page, current); }
  return {
    leads: leads.length,
    quoteLeads: quoteLeads.length,
    claims: claims.length,
    newLeads: leads.filter((lead) => lead.status === "new").length,
    routedLeads: leads.filter((lead) => lead.status === "routed").length,
    quoteRate: leads.length ? quoteLeads.length / leads.length : 0,
    revenueCents: quoteLeads.reduce((sum, lead) => sum + (lead.revenueCents ?? 0), 0),
    wonLeads: quoteLeads.filter((lead) => lead.outcome === "won").length,
    byService: serviceCounts,
    byMetro: metroCounts.map(({ service, count }) => ({ metro: service, count })),
    byPage: Array.from(pageMap, ([page, value]) => ({ page, ...value })).sort((a, b) => b.revenueCents - a.revenueCents || b.leads - a.leads),
  };
}

function countBy(rows: Lead[], getKey: (row: Lead) => string): Array<{ service: string; count: number }> {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(getKey(row), (counts.get(getKey(row)) ?? 0) + 1);
  return Array.from(counts, ([service, count]) => ({ service, count })).sort((a, b) => b.count - a.count);
}
