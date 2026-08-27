import Link from "next/link";
import { ArrowRight, CheckCircle, FileText, MagnifyingGlass, MapPin } from "@/components/Icons";
import { pageMetadata, breadcrumbLd, webPageLd } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "How DwellGauge Works",
  description: "Learn how DwellGauge turns a home project into a local estimate, source notes, and a better quote request.",
  path: "/how-it-works",
});

const guide = [
  { icon: FileText, title: "Name the scope", text: "Choose a defined project such as an HVAC replacement, roof replacement, or panel upgrade." },
  { icon: MapPin, title: "Choose the market", text: "Open your metro page to see local labor, material, permit, climate, and housing-age assumptions." },
  { icon: MagnifyingGlass, title: "Check the record", text: "Search the public license index, then confirm current information with the state authority." },
  { icon: CheckCircle, title: "Request the next call", text: "When the range and scope make sense, send a quote request with enough detail for a useful response." },
];

export default function HowItWorks() {
  return <>
    <div className="page-hero"><div className="wrap"><div className="breadcrumbs"><Link href="/">Home</Link> / How it works</div><h1>Research first. Call second.</h1><p>DwellGauge keeps the early homeowner workflow in a practical order: understand the work, inspect the evidence, then talk to contractors.</p></div></div>
    <section className="section"><div className="wrap"><div className="workflow-list">{guide.map(({ icon: Icon, title, text }) => <div className="workflow-row" key={title}><span className="workflow-icon"><Icon size={23} aria-hidden /></span><div><h2>{title}</h2><p className="muted">{text}</p></div></div>)}</div></div></section>
    <section className="home-section"><div className="wrap split-note"><div><h2>What the number is for.</h2><p>A planning range helps you compare the scale of a project, spot missing scope, and decide which questions belong in a quote.</p></div><div><h2>What it is not.</h2><p>It is not a bid, a guarantee, or a substitute for a site visit, a load calculation, a permit review, or an official license check.</p></div></div></section>
    <section className="verify-band"><div className="wrap narrow-band"><h2>Take the workflow to your project.</h2><p>Start with the cost guide, or use the HVAC calculator when sizing is the first question.</p><div className="hero-actions"><Link className="button" href="/costs">Browse costs <ArrowRight size={16} aria-hidden /></Link><Link className="button secondary" href="/tools/hvac-calculator">Open HVAC calculator</Link></div></div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([webPageLd({ name: "How DwellGauge works", description: "The DwellGauge workflow for researching a home project before requesting quotes.", path: "/how-it-works" }), breadcrumbLd([{ name: "Home", href: "/" }, { name: "How it works", href: "/how-it-works" }])]) }} />
  </>;
}
