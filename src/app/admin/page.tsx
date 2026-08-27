import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getLeadStore } from "@/lib/leadstore";
import { countLicensesAsync } from "@/lib/datasets";
import ClaimStatusButton from "@/components/ClaimStatusButton";
import { pageMetadata } from "@/lib/seo";
import { licensePath } from "@/lib/site";
import ReportingPanel from "@/components/ReportingPanel";
import LeadOutcomeControl from "@/components/LeadOutcomeControl";
import FreshnessPanel from "@/components/FreshnessPanel";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({ title: "Partner admin", description: "Private DwellGauge operations dashboard.", path: "/admin", noindex: true });

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!(await isAdminAuthenticated())) return <section className="section"><div className="wrap" style={{ maxWidth: 520 }}><form className="form-card" action="/api/admin/login" method="post"><span className="eyebrow">Private dashboard</span><h1>Partner admin</h1><p className="muted">Sign in to review quote requests and contractor claims.</p><label className="field">Password<input required name="password" type="password" autoComplete="current-password" /></label><button className="button full">Sign in</button>{(await searchParams).error && <p className="small" style={{ color: "#a23b35" }}>Invalid password.</p>}</form></div></section>;

  const store = getLeadStore();
  const [leads, claims] = await Promise.all([store.listLeads(), store.listClaims()]);
  return <section className="section"><div className="wrap">
    <div className="section-head"><div><span className="eyebrow">Operations</span><h1>Lead inbox</h1></div><form action="/api/admin/logout" method="post"><button className="button secondary">Sign out</button></form></div>
    <div className="stats"><div className="stat"><strong>{leads.length}</strong><span>Total leads</span></div><div className="stat"><strong>{leads.filter(x => x.status === "new").length}</strong><span>New requests</span></div><div className="stat"><strong>{claims.filter(x => x.status === "pending").length}</strong><span>Pending claims</span></div><div className="stat"><strong>{await countLicensesAsync({})}</strong><span>Indexed records</span></div></div>
    <FreshnessPanel />
    <ReportingPanel />
    <div className="card" style={{ marginTop: 24 }}><h2>Recent requests</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Received</th><th>Type</th><th>Contact</th><th>Details</th><th>Routing and outcome</th></tr></thead><tbody>{leads.map(l => <tr key={l.id}><td>{new Date(l.createdAt).toLocaleString()}</td><td>{l.type}</td><td>{l.name ?? "Not provided"}<br /><span className="small muted">{l.email}</span></td><td>{l.serviceSlug ?? "General inquiry"}<br /><span className="small muted">{l.message?.slice(0, 100)}</span></td><td><LeadOutcomeControl id={l.id} initialStatus={l.status} initialOutcome={l.outcome} initialRevenue={l.revenueCents} /></td></tr>)}{!leads.length && <tr><td colSpan={5}>No requests yet.</td></tr>}</tbody></table></div></div>
    <div className="card" style={{ marginTop: 24 }}><h2>Contractor claims</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Received</th><th>Business</th><th>Contact</th><th>License</th><th>Status</th></tr></thead><tbody>{claims.map(c => <tr key={c.id}><td>{new Date(c.createdAt).toLocaleString()}</td><td>{c.businessName}</td><td>{c.contactName}<br /><span className="small muted">{c.email}</span></td><td><a href={licensePath(c.licenseId)}>{c.licenseId}</a></td><td><ClaimStatusButton id={c.id} initialStatus={c.status} /></td></tr>)}{!claims.length && <tr><td colSpan={5}>No claims yet.</td></tr>}</tbody></table></div></div>
  </div></section>;
}
