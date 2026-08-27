import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Disclaimer",
  description: "Important limitations of DwellGauge cost estimates, public contractor records, and paid placement.",
  path: "/disclaimer",
});

export default function Disclaimer() {
  return <section className="section"><div className="wrap legal-page"><div className="breadcrumbs"><Link href="/">Home</Link> / Disclaimer</div><h1>Important disclaimer</h1><div className="notice">Cost ranges are planning tools, not bids. License pages are an index of public information, not official verification.</div><h2>Cost information</h2><p>Project cost depends on site conditions, measurements, access, finish level, equipment, code requirements, contractor availability, and other facts a remote model cannot see. Obtain multiple written quotes and confirm the project scope before work begins.</p><h2>License and business information</h2><p>License, complaint, bonding, insurance, and business information can change. Confirm the license number, active status, coverage, and complaint history with the official state licensing authority and the contractor.</p><h2>Leads and paid placement</h2><p>DwellGauge may receive compensation for qualified leads, manually managed partner pilots, or featured listings. Paid activity does not change public-record fields, license status, source notes, or modeled cost ranges. Sponsored placement should be labeled where it appears.</p><h2>No professional advice</h2><p>Nothing on this site replaces a site visit, engineering or load calculation, permit review, written contract, insurance review, or professional legal, financial, construction, or safety advice. Read the <Link className="muted-link" href="/methodology">methodology</Link> for the model boundaries and sources.</p></div></section>;
}
