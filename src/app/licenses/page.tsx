import Link from "next/link";
import { ArrowRight, MagnifyingGlass } from "@/components/Icons";
import { searchLicensesAsync, licenseStatesAsync, countLicensesAsync } from "@/lib/datasets";
import { pageMetadata, breadcrumbLd, itemListLd, webPageLd } from "@/lib/seo";
import { DEMO_MODE, licensePath } from "@/lib/site";
import MissingLicenseForm from "@/components/MissingLicenseForm";

export const dynamic = "force-dynamic";

type SearchParams = { q?: string | string[]; state?: string | string[]; trade?: string | string[] };
function first(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const q = first(params.q);
  const state = first(params.state);
  const trade = first(params.trade);
  const filtered = Boolean(q || state || trade);
  const hasRecords = (await countLicensesAsync({})) > 0;
  return pageMetadata({
    title: filtered ? "Search Contractor License Records" : "Contractor License Lookup",
    description: filtered ? "Search results from the DwellGauge public contractor license index." : "Search public contractor license records by company, license number, city, state, or trade before hiring.",
    path: "/licenses",
    keywords: ["contractor license lookup", "verify contractor license", "licensed contractor search", "public license records"],
    noindex: filtered || !hasRecords,
  });
}

export default async function Licenses({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const q = first(params.q);
  const state = first(params.state);
  const trade = first(params.trade);
  const [rows, states, count] = await Promise.all([searchLicensesAsync({ q, state, trade }), licenseStatesAsync(), countLicensesAsync({ q, state, trade })]);
  const listItems = rows.slice(0, 25).map((row) => ({ name: `${row.businessName} license record`, href: licensePath(row.id) }));

  return <>
    <div className="page-hero"><div className="wrap"><div className="breadcrumbs"><Link href="/">Home</Link> / License lookup</div><h1>Check the record before you sign.</h1><p>Search public contractor records by business name, license number, city, state, or trade. Then confirm the current status and insurance with the relevant authority.</p></div></div>
    <section className="section"><div className="wrap">
      <div className="search-panel">
        <h2>Search public records</h2>
        <form className="search" method="get">
          <label className="sr-only" htmlFor="license-query">Company name, license number, or city</label><input id="license-query" name="q" defaultValue={q} placeholder="Company name, license number, or city" />
          <label className="sr-only" htmlFor="license-state">Filter by state</label><select id="license-state" name="state" defaultValue={state ?? ""}><option value="">All states</option>{states.map((item) => <option key={item.code} value={item.code}>{item.code} ({item.count})</option>)}</select>
          <label className="sr-only" htmlFor="license-trade">Filter by trade</label><select id="license-trade" name="trade" defaultValue={trade ?? ""}><option value="">All trades</option>{["hvac", "roofing", "plumbing", "electrical", "painting"].map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <button type="submit"><MagnifyingGlass size={17} aria-hidden /> Search</button>
        </form>
      </div>
      {DEMO_MODE && <div className="notice">Sample records are labeled in the results. Connect an official state-board sync before publishing production records.</div>}
      <div className="section-head"><div><p className="record-count">{count.toLocaleString()} records returned</p><h2>{q || state || trade ? "Matching contractors" : "Indexed contractors"}</h2></div><Link className="button secondary" href="/get-listed">List your business <ArrowRight size={16} aria-hidden /></Link></div>
      {rows.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Business</th><th>Trade</th><th>License</th><th>Location</th><th>Status</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><Link href={licensePath(row.id)}>{row.businessName}</Link></td><td>{row.trade}</td><td>{row.licenseNumber}</td><td>{row.city ?? "Not reported"}, {row.stateCode}</td><td><span className={`pill ${row.status !== "active" ? "bad" : ""}`}>{row.status}</span></td></tr>)}</tbody></table></div> : <div className="search-empty"><h3>No matching records.</h3><p className="muted">Try a broader company name or license number, or check the official state authority directly.</p></div>}
      <div className="missing-license-section" style={{ marginTop: 34 }}><MissingLicenseForm /></div>
      <div className="callout" style={{ marginTop: 22 }}><h3>Use this index as a starting point</h3><p className="small muted">DwellGauge republishes public information for discovery. Records can change or be incomplete. Verify the license number, status, complaints, bonding, and insurance with the official licensing authority before hiring. See how data is collected in the <Link className="muted-link" href="/methodology">methodology</Link>.</p></div>
    </div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([webPageLd({ name: "Contractor license lookup", description: "Search public contractor license records before hiring.", path: "/licenses" }), breadcrumbLd([{ name: "Home", href: "/" }, { name: "License lookup", href: "/licenses" }]), ...(listItems.length ? [itemListLd(listItems)] : [])]) }} />
  </>;
}
