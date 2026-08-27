import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How DwellGauge handles information submitted through quote requests, listing claims, and site usage.",
  path: "/privacy",
});

export default function Privacy() {
  return <section className="section"><div className="wrap legal-page"><div className="breadcrumbs"><Link href="/">Home</Link> / Privacy</div><h1>Privacy policy</h1><p className="legal-date">Last updated August 2026</p><div className="notice">This policy describes the information DwellGauge receives through this site and how it is used to operate the service.</div><h2>Information you submit</h2><p>When you request project quotes, claim a listing, or contact us, we receive the information in the form, including your name, email address, phone number, ZIP code, business details, and project message. We use it to respond, review a listing, route a request, prevent abuse, and keep an operational record.</p><h2>Sharing with service providers</h2><p>Quote requests may be shared with relevant contractors so they can respond. We do not sell personal information. Contractors and other service providers may have their own privacy practices, so review their terms before continuing a conversation.</p><h2>Analytics and technical data</h2><p>The site may receive basic technical information such as browser, device, referring page, and request timing. Optional analytics integrations remain disabled until the site owner configures them. The site uses essential cookies or browser storage only where needed for a requested function, such as an administrative session.</p><h2>Retention and your choices</h2><p>We retain submissions for as long as needed to respond, operate the directory, resolve disputes, meet legal obligations, and maintain security. Ask the site owner to review, correct, or remove a submission using the contact route shown in your confirmation or the <Link className="muted-link" href="/contact">contact page</Link>. We may need to verify the request before changing a record.</p><h2>Changes to this policy</h2><p>We may update this policy when the service or its data practices change. The date above identifies the current version.</p></div></section>;
}
