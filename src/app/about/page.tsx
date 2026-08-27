import Link from "next/link";
import { ArrowRight, CheckCircle, HouseLine } from "@/components/Icons";
import { pageMetadata, breadcrumbLd, webPageLd } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About DwellGauge",
  description: "Why DwellGauge combines project cost context and public contractor records for homeowners.",
  path: "/about",
});

export default function About() {
  return <>
    <div className="page-hero"><div className="wrap"><div className="breadcrumbs"><Link href="/">Home</Link> / About</div><h1>A better first step for a big home decision.</h1><p>DwellGauge gives homeowners a place to understand the job before the sales conversation begins.</p></div></div>
    <section className="section"><div className="wrap article-grid"><article><h2>Start with context, not a pitch.</h2><p>Home projects are difficult to compare because every contractor describes the work differently. DwellGauge defines a project, shows a local planning range, and points to the evidence used to build it.</p><p>The goal is not to predict a final bid. The goal is to help you ask better questions and recognize when a quote does not match the work you described.</p><h2>Keep verification in the homeowner&apos;s hands.</h2><p>License records can change. We make public information easier to find, but the state licensing authority remains the place to confirm current status, insurance, complaints, and requirements.</p></article><aside className="principle-list"><div><HouseLine size={22} aria-hidden /><strong>Define the work</strong><span>Compare like with like.</span></div><div><CheckCircle size={22} aria-hidden /><strong>Show the evidence</strong><span>Read the inputs and limits.</span></div><div><ArrowRight size={22} aria-hidden /><strong>Choose the next step</strong><span>Request quotes when ready.</span></div></aside></div></section>
    <section className="verify-band"><div className="wrap narrow-band"><h2>See how the numbers are made.</h2><p>Our methodology explains the benchmark, local adjustments, and source gaps in plain language.</p><Link className="button" href="/methodology">Read the methodology <ArrowRight size={16} aria-hidden /></Link></div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([webPageLd({ name: "About DwellGauge", description: "Why DwellGauge combines cost context and public contractor records.", path: "/about" }), breadcrumbLd([{ name: "Home", href: "/" }, { name: "About", href: "/about" }])]) }} />
  </>;
}
