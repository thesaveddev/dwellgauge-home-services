import Link from "next/link";
import { ArrowRight, CheckCircle, HouseLine, Wrench } from "@/components/Icons";
import { pageMetadata } from "@/lib/seo";
import BillingActions from "@/components/BillingActions";

export const metadata = pageMetadata({
  title: "Get Your Contracting Business Listed",
  description: "Claim a public contractor record, request a correction, or discuss a manually managed DwellGauge partner pilot.",
  path: "/get-listed",
  keywords: ["contractor listing", "claim contractor profile", "home services leads", "contractor directory"],
});

export default function GetListed() {
  return <>
    <div className="page-hero"><div className="wrap"><div className="breadcrumbs"><Link href="/">Home</Link> / For contractors</div><h1>Be easy to verify when homeowners are ready.</h1><p>Start with the public record. Correct what is wrong, add the service area you actually cover, and keep sponsored activity separate from licensing facts.</p></div></div>
    <section className="section"><div className="wrap offer-list"><div className="offer-row"><span className="offer-label">No charge</span><div><h2>Claim your profile</h2><p>Request ownership of an indexed record and submit corrections for review. Approved claims are handled by our team.</p></div><Link className="button secondary" href="/licenses">Find your record <ArrowRight size={16} aria-hidden /></Link></div><div className="offer-row"><span className="offer-label">Featured listing</span><div><h2>Put your profile in front of active researchers</h2><p>Featured placement is clearly labeled and never changes public-record fields, license status, or modeled cost ranges.</p><BillingActions priceId={process.env.NEXT_PUBLIC_STRIPE_FEATURED_PRICE_ID} /></div></div><div className="offer-row"><span className="offer-label">Lead routing</span><div><h2>Explore local inquiries</h2><p>Share the market and project types you serve. We can discuss a manual pilot while automated billing and placement controls are still being built.</p></div><Link className="button secondary" href="/contact">Contact DwellGauge <ArrowRight size={16} aria-hidden /></Link></div></div></section>
    <section className="verify-band"><div className="wrap split-note"><div><h2>What homeowners see.</h2><p>Public fields remain tied to the source record. We encourage every visitor to verify the current license with the relevant authority.</p></div><div><h2>What payment cannot change.</h2><p>Sponsored activity does not change license status, complaints, source notes, or modeled project costs.</p></div></div></section>
    <section className="home-section compact"><div className="wrap narrow-band"><h2>Have a record to correct?</h2><p>Open the license lookup, find the business, and submit a claim request with enough detail for ownership review.</p><Link className="button" href="/licenses">Open license lookup <ArrowRight size={16} aria-hidden /></Link></div></section>
  </>;
}
