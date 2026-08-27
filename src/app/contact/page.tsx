import Link from "next/link";
import { ArrowRight, FileText, HouseLine, Wrench } from "@/components/Icons";
import { pageMetadata, breadcrumbLd, webPageLd } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Contact DwellGauge", description: "Choose the right DwellGauge route for a project request, listing correction, or data question.", path: "/contact" });

export default function ContactPage() {
  return <>
    <div className="page-hero"><div className="wrap"><div className="breadcrumbs"><Link href="/">Home</Link> / Contact</div><h1>Choose the right route.</h1><p>Different questions need different information. Start with the route that matches what you need done.</p></div></div>
    <section className="section"><div className="wrap contact-grid"><Link className="contact-row" href="/get-quotes"><span className="contact-icon"><HouseLine size={23} aria-hidden /></span><span><h2>Request project quotes</h2><p>Share the work, location, and best way to reach you.</p></span><ArrowRight size={19} aria-hidden /></Link><Link className="contact-row" href="/claim"><span className="contact-icon"><Wrench size={23} aria-hidden /></span><span><h2>Claim or correct a listing</h2><p>Tell us which public business record needs review.</p></span><ArrowRight size={19} aria-hidden /></Link><Link className="contact-row" href="/methodology"><span className="contact-icon"><FileText size={23} aria-hidden /></span><span><h2>Question the data</h2><p>Read the method and source notes before using an estimate.</p></span><ArrowRight size={19} aria-hidden /></Link></div></section>
    <section className="home-section compact"><div className="wrap narrow-band"><h2>Looking for a public record?</h2><p>Search by business name, license number, city, state, or trade in the license lookup.</p><Link className="button" href="/licenses">Open license lookup <ArrowRight size={16} aria-hidden /></Link></div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([webPageLd({ name: "Contact DwellGauge", description: "Routes for project requests, listing corrections, and data questions.", path: "/contact" }), breadcrumbLd([{ name: "Home", href: "/" }, { name: "Contact", href: "/contact" }])]) }} />
  </>;
}
