import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Envelope,
  Globe,
  MapPin,
  PhoneCall,
  ShieldCheck,
  WarningCircle,
  Wrench,
} from "@/components/Icons";
import { notFound } from "next/navigation";
import { getLicenseAsync } from "@/lib/datasets";
import { dateStr } from "@/lib/format";
import { getProfile, baseProfile, isFeatured } from "@/lib/profile-store";
import { stateAuthorityUrl } from "@/lib/site";
import { breadcrumbLd, pageMetadata, webPageLd } from "@/lib/seo";
import BillingActions from "@/components/BillingActions";

export const revalidate = 300;
export const dynamicParams = true;

export default async function ContractorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getLicenseAsync(id);
  if (!record) notFound();

  const stored = await getProfile(record);
  const profile = stored ?? baseProfile(record);
  // Marketing content is only public once ownership is approved (or the record has
  // an explicit verified/featured flag). A claimed-but-pending profile shows its
  // submitted content only as a preview to the owner, never as fact to visitors.
  const approved = Boolean(stored) && (stored!.status === "approved" || stored!.status === "live" || stored!.verified || stored!.featured);
  const featured = isFeatured(stored, record);
  const hasContact = approved && Boolean(profile.website || profile.email || profile.phone);
  const authority = stateAuthorityUrl(record.stateCode);
  const licenseHref = `/licenses/${encodeURIComponent(record.id)}`;
  const claimHref = `/claim?license=${encodeURIComponent(record.id)}`;

  const seoName = `${record.businessName} | ${record.classification ?? record.trade} Contractor Profile`;
  const path = `${licenseHref}/profile`;

  return <>
    <div className="page-hero">
      <div className="wrap">
        <div className="breadcrumbs">
          <Link href="/">Home</Link> / <Link href="/licenses">License lookup</Link> / <Link href={licenseHref}>{record.businessName}</Link> / Profile
        </div>        <div className="profile-head">
          <div>
            {featured && <span className="pill">Featured</span>}
            {profile.verified && <span className="pill">License verified</span>}
            <h1>{record.businessName}</h1>
            <p>{approved && profile.tagline ? profile.tagline : `${record.classification ?? record.trade} contractor serving ${record.city ?? record.stateCode}`}</p>
          </div>
          <div className="profile-head-actions">
            <a className="button secondary" href={authority} target="_blank" rel="noreferrer">Open official source</a>
            <Link className="button" href={claimHref}>Claim this listing <ArrowRight size={16} aria-hidden /></Link>
          </div>
        </div>
      </div>
    </div>

    <section className="section"><div className="wrap content-grid">
      <div>
        {/* Marketing layer — shown only when ownership is approved */}
        <div className="card profile-main">
          {approved ? (<>
            <div className="profile-section-title"><Wrench size={18} color="var(--accent)" aria-hidden /><h2>They fix</h2></div>
            <p>{profile.servicesOffered.length ? profile.servicesOffered.map((s) => <span className="tag" key={s}>{s}</span>) : <span className="muted small">Services will appear here once the profile is completed.</span>}</p>

            {profile.serviceAreas.length > 0 && (
              <>
                <div className="profile-section-title" style={{ marginTop: 20 }}><MapPin size={18} color="var(--accent)" aria-hidden /><h2>Service area</h2></div>
                <p>{profile.serviceAreas.join(", ")}{record.county ? ` (${record.county} County)` : ""}</p>
              </>
            )}

            {profile.about && (
              <>
                <div className="profile-section-title" style={{ marginTop: 20 }}><BookOpen size={18} color="var(--accent)" aria-hidden /><h2>About</h2></div>
                <p className="muted">{profile.about}</p>
              </>
            )}
          </>) : (
            <p className="muted small">This contractor profile is awaiting ownership verification. Public license details are shown below; marketing and contact details appear here once ownership is approved.</p>
          )}
        </div>

        {/* Public record — source controlled, clearly separated */}
        <div className="card" style={{ marginTop: 18 }}>
          <div className="license-summary">
            <div><span className="record-label">Public record</span><h2>{record.licenseNumber}</h2></div>
            <span className={`pill ${record.status !== "active" ? "bad" : ""}`}>{record.status}</span>
          </div>
          <div className="license-meta">
            <p className="small"><strong>Trade</strong><span>{record.classification ?? record.trade}</span></p>
            <p className="small"><strong>Location</strong><span>{record.city ?? "Not reported"}{record.county ? `, ${record.county} County` : ""}, {record.stateCode}</span></p>
            <p className="small"><strong>Issued</strong><span>{record.issuedAt ? dateStr(record.issuedAt) : "Not available"}</span></p>
            <p className="small"><strong>Expires</strong><span>{record.expiresAt ? dateStr(record.expiresAt) : "Not available"}</span></p>
            <p className="small"><strong>Bonded</strong><span>{record.bonded ? "Reported yes" : "Not reported"}</span></p>
            <p className="small"><strong>Insured</strong><span>{record.insured ? "Reported yes" : "Not reported"}</span></p>
          </div>
          <p className="small muted" style={{ marginTop: 12 }}><ShieldCheck size={14} style={{ verticalAlign: -2 }} aria-hidden /> Public fields come from the official state record and never change for paid partners.</p>
        </div>

        <div className="callout" style={{ marginTop: 18 }}><h3>Verify this record before hiring</h3><p className="small muted">This page is an index of public information, not official verification. Confirm the license number, active status, insurance, and complaint history with the {record.stateCode} licensing authority before signing a contract.</p><a className="button secondary" href={authority} target="_blank" rel="noreferrer">Open official source <ArrowRight size={16} aria-hidden /></a></div>
      </div>

      <aside className="side-card">
        <div className="form-card">
          {approved && hasContact && (
            <div className="profile-contact">
              {profile.phone && <div><PhoneCall size={18} color="var(--accent)" aria-hidden /><span>{profile.phone}</span></div>}
              {profile.email && <div><Envelope size={18} color="var(--accent)" aria-hidden /><span>{profile.email}</span></div>}
              {profile.website && <div><Globe size={18} color="var(--accent)" aria-hidden /><span>{profile.website}</span></div>}
            </div>
          )}
          <div className="profile-claim-card">
            <ShieldCheck size={26} color="var(--accent)" aria-hidden />
            <h2>Is this you?</h2>
            <p className="muted small">
              {approved
                ? "This profile is claimed. Manage placement, services, and routing from your account."
                : "Claim this listing to verify ownership, then add services, contact info, and review placement."}
            </p>
            <Link className="button full" href={claimHref}>{approved ? "Manage this profile" : approved === false && Boolean(stored) ? "Verify your claim" : "Claim this listing"} <ArrowRight size={16} aria-hidden /></Link>
            <div style={{ marginTop: 18 }}><BillingActions priceId={process.env.NEXT_PUBLIC_STRIPE_FEATURED_PRICE_ID} licenseId={record.id} /></div>
            <p className="small muted" style={{ marginTop: 12 }}><WarningCircle size={14} style={{ verticalAlign: -2 }} aria-hidden /> Public-record fields remain under official control. Payment cannot change your license status.</p>
          </div>
        </div>
      </aside>
    </div></section>

    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([webPageLd({ name: seoName, description: `${record.classification ?? record.trade} contractor profile and license record for ${record.businessName} in ${record.city ?? record.stateCode}, ${record.stateCode}.`, path }), breadcrumbLd([{ name: "Home", href: "/" }, { name: "License lookup", href: "/licenses" }, { name: record.businessName, href: licenseHref }])]) }} />
  </>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const record = await getLicenseAsync((await params).id);
  if (!record) return {};
  const stored = await getProfile(record);
  const profile = stored ?? baseProfile(record);
  const approved = Boolean(stored) && (stored!.status === "approved" || stored!.status === "live" || stored!.verified || stored!.featured);
  const area = approved && profile.serviceAreas.length ? profile.serviceAreas[0] : (record.city ?? record.stateCode);
  return pageMetadata({
    title: `${record.businessName} | ${record.classification ?? record.trade} Contractor Profile`,
    description: `${record.classification ?? record.trade} contractor serving ${area}. License ${record.licenseNumber} — verify status with the official ${record.stateCode} authority.`,
    path: `/licenses/${encodeURIComponent(record.id)}/profile`,
    keywords: [`${record.businessName} contractor`, `${record.trade} contractor ${record.city ?? record.stateCode}`, `${record.licenseNumber} license record`, `${record.stateCode} ${record.trade} profile`],
  });
}