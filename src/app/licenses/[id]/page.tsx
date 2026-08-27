import Link from "next/link";
import { ArrowRight, ArrowUpRight, ShieldCheck } from "@/components/Icons";
import { notFound } from "next/navigation";
import { getLicenseAsync } from "@/lib/datasets";
import { dateStr } from "@/lib/format";
import { breadcrumbLd, licenseRecordLd, pageMetadata, webPageLd } from "@/lib/seo";
import { licensePath, stateAuthorityUrl } from "@/lib/site";

export const revalidate = 86_400;
export const dynamicParams = true;

export default async function LicensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getLicenseAsync(id);
  if (!record) notFound();
  const path = licensePath(record.id);
  const authority = stateAuthorityUrl(record.stateCode);

  return <>
    <div className="page-hero"><div className="wrap"><div className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/licenses">License lookup</Link> / {record.businessName}</div><h1>{record.businessName}</h1><p>{record.classification ?? record.trade} contractor in {record.city ?? "an unreported location"}, {record.stateCode}. License number {record.licenseNumber}.</p></div></div>
    <section className="section"><div className="wrap content-grid"><div>
      <div className="card">
        <div className="license-summary"><div><span className="record-label">Public record status</span><h2>{record.licenseNumber}</h2></div><span className={`pill ${record.status !== "active" ? "bad" : ""}`}>{record.status}</span></div>
        <div className="license-meta"><p className="small"><strong>Trade</strong><span>{record.classification ?? record.trade}</span></p><p className="small"><strong>Location</strong><span>{record.city ?? "Not reported"}{record.county ? `, ${record.county} County` : ""}, {record.stateCode}</span></p><p className="small"><strong>Issued</strong><span>{record.issuedAt ? dateStr(record.issuedAt) : "Not available"}</span></p><p className="small"><strong>Expires</strong><span>{record.expiresAt ? dateStr(record.expiresAt) : "Not available"}</span></p><p className="small"><strong>Bonded</strong><span>{record.bonded ? "Reported yes" : "Not reported"}</span></p><p className="small"><strong>Insured</strong><span>{record.insured ? "Reported yes" : "Not reported"}</span></p></div>
      </div>
      <div className="callout" style={{ marginTop: 18 }}><h3>Verify this record before hiring</h3><p className="small muted">This page is an index of public information, not official verification. Confirm the license number, active status, insurance, and complaint history with the {record.stateCode} licensing authority before signing a contract.</p><a className="button secondary" href={authority} target="_blank" rel="noreferrer">Open official source <ArrowUpRight size={16} aria-hidden /></a></div>
      <div className="section-block"><h2>Related guidance</h2><p className="muted">Compare local {record.trade} project costs in the <Link className="muted-link" href="/costs">home project cost guide</Link>, then request quotes only after checking credentials and scope.</p></div>
    </div><aside className="side-card"><div className="form-card"><ShieldCheck size={26} color="var(--accent)" aria-hidden /><h2>Is this your business?</h2><p className="muted small">Preview your contractor profile, request corrections, add service areas, and review placement.</p><Link className="button" href={`/licenses/${encodeURIComponent(record.id)}/profile`}>View your profile <ArrowRight size={16} aria-hidden /></Link><Link className="button secondary" href={`/claim?license=${encodeURIComponent(record.id)}`} style={{ marginTop: 10, width: "100%" }}>Claim this listing</Link></div></aside></div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([webPageLd({ name: `${record.businessName} license record`, description: `${record.classification ?? record.trade} contractor license record in ${record.city ?? record.stateCode}.`, path }), breadcrumbLd([{ name: "Home", href: "/" }, { name: "License lookup", href: "/licenses" }, { name: record.businessName, href: path }]), licenseRecordLd(record, path)]) }} />
  </>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const record = await getLicenseAsync((await params).id);
  if (!record) return {};
  return pageMetadata({
    title: `${record.businessName} License Record | ${record.licenseNumber}`,
    description: `Public ${record.trade} contractor license record for ${record.businessName} in ${record.city ?? record.stateCode}, ${record.stateCode}. Check status, dates, and official verification source before hiring.`,
    path: licensePath(record.id),
    keywords: [`${record.businessName} license`, `${record.licenseNumber} lookup`, `${record.trade} contractor ${record.city ?? record.stateCode}`, `${record.stateCode} contractor license lookup`],
  });
}
