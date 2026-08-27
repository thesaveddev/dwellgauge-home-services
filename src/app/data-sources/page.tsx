import Link from "next/link";
import { ArrowRight, Database, FileText, ShieldCheck } from "@/components/Icons";
import { pageMetadata, breadcrumbLd, webPageLd } from "@/lib/seo";

export const metadata = pageMetadata({ title: "DwellGauge Data Sources", description: "See the public and modeled sources behind DwellGauge home project estimates and contractor record pages.", path: "/data-sources" });

const sources = [
  { icon: Database, title: "Project benchmarks", text: "Defined national project scopes provide the starting range. The benchmark basis is shown on each service guide." },
  { icon: FileText, title: "Labor and market context", text: "Metropolitan wage data and regional materials factors can adjust the labor and materials portions of a local estimate." },
  { icon: ShieldCheck, title: "Licensing authorities", text: "Public license records are imported by state when an official source adapter is available. Each published record links to the authority used for verification." },
];

export default function DataSourcesPage() {
  return <>
    <div className="page-hero"><div className="wrap"><div className="breadcrumbs"><Link href="/">Home</Link> / Data sources</div><h1>Every number has a boundary.</h1><p>DwellGauge separates modeled planning information from public records so you know what to verify before acting.</p></div></div>
    <section className="section"><div className="wrap source-page-grid"><div>{sources.map(({ icon: Icon, title, text }) => <div className="source-feature" key={title}><span className="contact-icon"><Icon size={23} aria-hidden /></span><div><h2>{title}</h2><p className="muted">{text}</p></div></div>)}</div><aside className="callout"><h3>What we do not claim</h3><p className="muted">A planning range is not a bid. An indexed record is not an official verification. Empty or synthetic data should never be presented as current coverage.</p><Link className="text-link" href="/disclaimer">Read the full disclaimer <ArrowRight size={16} aria-hidden /></Link></aside></div></section>
    <section className="verify-band"><div className="wrap narrow-band"><h2>See the calculation in context.</h2><p>The methodology page explains the model and the limits that travel with it.</p><Link className="button" href="/methodology">Read methodology <ArrowRight size={16} aria-hidden /></Link></div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([webPageLd({ name: "DwellGauge data sources", description: "Public and modeled sources behind DwellGauge estimates and records.", path: "/data-sources" }), breadcrumbLd([{ name: "Home", href: "/" }, { name: "Data sources", href: "/data-sources" }])]) }} />
  </>;
}
