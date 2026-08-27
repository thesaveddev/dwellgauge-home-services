import Link from "next/link";
import { ArrowRight, CheckCircle } from "@/components/Icons";
import LeadForm from "@/components/LeadForm";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Get Free Home Project Quotes",
  description: "Share your home project and location to connect with relevant local contractors. No obligation to hire.",
  path: "/get-quotes",
  keywords: ["get home improvement quotes", "local contractor quotes", "free home project estimate"],
});

export default function GetQuotes() {
  return <>
    <div className="page-hero"><div className="wrap"><div className="breadcrumbs"><Link href="/">Home</Link> / Get quotes</div><h1>Bring a clear scope to the first call.</h1><p>Tell us what you need and where you are. We will share the request with relevant service providers so you can compare responses without committing to anyone.</p></div></div>
    <section className="section"><div className="wrap quote-grid"><div className="quote-copy"><h2>What happens after you send it?</h2><div className="workflow-list"><div className="workflow-row"><span className="workflow-icon"><CheckCircle size={22} aria-hidden /></span><div><h2>We read the project</h2><p className="muted">The trade, location, phone, and message help us understand which contractors are relevant.</p></div></div><div className="workflow-row"><span className="workflow-icon"><CheckCircle size={22} aria-hidden /></span><div><h2>Relevant pros respond</h2><p className="muted">Contractors may contact you directly using the details you provide. Response times vary by market.</p></div></div><div className="workflow-row"><span className="workflow-icon"><CheckCircle size={22} aria-hidden /></span><div><h2>You decide</h2><p className="muted">Compare scope, licensing, insurance, timing, and written quotes. There is no obligation to hire.</p></div></div></div><div className="notice">DwellGauge does not replace your own verification. Check every license, insurance certificate, permit requirement, and written quote independently.</div><Link className="text-link" href="/how-it-works">Read the homeowner workflow <ArrowRight size={16} aria-hidden /></Link></div><LeadForm /></div></section>
  </>;
}
