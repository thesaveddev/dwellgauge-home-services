import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of Use",
  description: "Terms governing use of DwellGauge cost guides, public contractor records, quote requests, and listing claims.",
  path: "/terms",
});

export default function Terms() {
  return <section className="section"><div className="wrap legal-page"><div className="breadcrumbs"><Link href="/">Home</Link> / Terms</div><h1>Terms of use</h1><p className="legal-date">Last updated August 2026</p><h2>Informational service</h2><p>DwellGauge provides planning estimates, source notes, and indexed public records for general information. We are not a contractor, regulator, insurer, lender, or legal adviser. A cost range is not a quote, guarantee, recommendation, or promise of savings.</p><h2>Verify before you hire</h2><p>Public records can be incomplete or out of date. You are responsible for confirming credentials, license status, insurance, permits, scope, timing, and price directly with the contractor and relevant government authority.</p><h2>Quote requests</h2><p>When you submit a quote request, you authorize DwellGauge to use the information to operate the request and share it with relevant service providers. Contractors may contact you directly. DwellGauge does not guarantee a response, availability, price, workmanship, or outcome.</p><h2>Listings and claims</h2><p>Businesses are responsible for information submitted through a claim. We may request evidence of ownership, reject a claim, correct information that conflicts with an official source, or remove a listing that cannot be supported.</p><h2>Acceptable use</h2><p>Do not scrape the service, abuse forms, impersonate a business, submit another person&apos;s information without permission, interfere with the site, or use the service for unlawful solicitation. We may limit access to protect people, records, and the service.</p><h2>Changes and availability</h2><p>We may change, suspend, or remove features and content. We make no promise that the service or any particular record will always be available, complete, current, or error-free.</p><h2>Contact</h2><p>Questions about these terms can be sent through the <Link className="muted-link" href="/contact">contact page</Link>.</p></div></section>;
}
