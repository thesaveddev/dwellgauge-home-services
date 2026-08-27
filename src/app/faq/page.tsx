import Link from "next/link";
import { ArrowRight } from "@/components/Icons";
import { pageMetadata, breadcrumbLd, faqLd, webPageLd } from "@/lib/seo";

const faqs = [
  { q: "Are DwellGauge cost ranges quotes?", a: "No. They are planning ranges for a defined project. Site conditions, scope, equipment, access, code, and contractor availability can change the final bid." },
  { q: "Where do the local adjustments come from?", a: "The model can use metropolitan wage data, materials factors, housing age, climate where relevant, and permit allowances. Each guide links to its source notes." },
  { q: "Does DwellGauge verify a contractor?", a: "No. The license lookup is an index of public information. Confirm the current license, insurance, complaints, and requirements with the official state authority." },
  { q: "How does requesting quotes work?", a: "You share your project details and contact information. Relevant contractors may contact you directly. There is no obligation to hire anyone." },
  { q: "Can a contractor pay to change a license record?", a: "No. Paid placement does not change public-record fields, license status, or modeled cost ranges. Sponsored placement should be clearly labeled." },
  { q: "How can I correct a business listing?", a: "Open the listing, use the claim route, and submit the business details you want reviewed. We may ask for information that helps establish ownership." },
];

export const metadata = pageMetadata({ title: "DwellGauge Frequently Asked Questions", description: "Answers about DwellGauge estimates, sources, license records, quote requests, and contractor listings.", path: "/faq" });

export default function FaqPage() {
  return <>
    <div className="page-hero"><div className="wrap"><div className="breadcrumbs"><Link href="/">Home</Link> / Common questions</div><h1>Questions before you use the number.</h1><p>Plain answers about the estimate, the records, and what happens when you request a quote.</p></div></div>
    <section className="section"><div className="wrap narrow-content"><div className="faq-list">{faqs.map((faq) => <div className="faq" key={faq.q}><h2>{faq.q}</h2><p className="muted">{faq.a}</p></div>)}</div><div className="callout"><h3>Still deciding?</h3><p className="muted">Read the methodology, browse a local estimate, or send a project request when you are ready.</p><div className="hero-actions"><Link className="button" href="/methodology">Read methodology <ArrowRight size={16} aria-hidden /></Link><Link className="button secondary" href="/get-quotes">Request quotes</Link></div></div></div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([webPageLd({ name: "DwellGauge frequently asked questions", description: "Answers about estimates, sources, records, and quote requests.", path: "/faq" }), breadcrumbLd([{ name: "Home", href: "/" }, { name: "Common questions", href: "/faq" }]), faqLd(faqs)]) }} />
  </>;
}
