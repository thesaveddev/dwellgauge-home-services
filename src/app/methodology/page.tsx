import Link from "next/link";
import { ArrowUpRight } from "@/components/Icons";
import { pageMetadata, breadcrumbLd, webPageLd } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Our Methodology and Data Sources",
  description: "Learn how DwellGauge calculates home project estimates from defined scopes, local wages, materials, permits, climate, and housing age.",
  path: "/methodology",
  keywords: ["home improvement cost methodology", "contractor cost data sources", "local construction cost estimates"],
});

const method = [
  { title: "Define the work", text: "Each guide names a consistent project scope, such as a 3-ton HVAC replacement or a 200-amp panel upgrade, so cities can be compared on the same basis." },
  { title: "Adjust the market", text: "Labor can use BLS Occupational Employment and Wage Statistics. Materials use a regional factor. Permit allowances come from published local schedules when available." },
  { title: "Account for the home", text: "Older housing can require more access and remediation. HVAC estimates incorporate a climate intensity allowance. These are modest planning adjustments, not promises." },
  { title: "Show a range", text: "The displayed range spans 18% below to 28% above the modeled median to account for finish level, access, contractor overhead, and project-specific conditions." },
];

export default function Methodology() {
  return <>
    <div className="page-hero"><div className="wrap"><div className="breadcrumbs"><Link href="/">Home</Link> / Methodology</div><h1>Numbers with a paper trail.</h1><p>Estimates are useful only when you understand where they came from. This is the model, its sources, and its limits.</p></div></div>
    <section className="section"><div className="wrap narrow-content"><div className="method-grid">{method.map((item) => <div className="method-item" key={item.title}><h2>{item.title}</h2><p>{item.text}</p></div>)}</div><hr className="rule" /><h2>Sources we use</h2><div className="source-list"><div className="source-line"><a href="https://www.bls.gov/oes/" target="_blank" rel="noreferrer">BLS OEWS: metropolitan wage data by occupation <ArrowUpRight size={14} aria-hidden /></a></div><div className="source-line"><a href="https://www.census.gov/programs-surveys/acs" target="_blank" rel="noreferrer">Census ACS: housing age and demographic context <ArrowUpRight size={14} aria-hidden /></a></div><div className="source-line"><a href="https://www.data.gov/" target="_blank" rel="noreferrer">Municipal open data: permits and project values where available <ArrowUpRight size={14} aria-hidden /></a></div><div className="source-line"><span>State licensing boards: contractor records, with state-specific links on each record</span></div></div><div className="notice" style={{ marginTop: 28 }}>Data refreshes monthly when source data is available. Seed estimates and demo license records are clearly labeled. Cost ranges are educational planning tools, not quotes or financial advice.</div></div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([webPageLd({ name: "DwellGauge methodology and data sources", description: "How DwellGauge builds home project estimates from public and modeled inputs.", path: "/methodology" }), breadcrumbLd([{ name: "Home", href: "/" }, { name: "Methodology", href: "/methodology" }])]) }} />
  </>;
}
