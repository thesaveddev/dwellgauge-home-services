import Link from "next/link";
import { ArrowRight, CheckCircle, Database, FileText, MapPin, ShieldCheck } from "@/components/Icons";
import { getEstimate, listMetros, listServices } from "@/lib/datasets";
import { usd } from "@/lib/format";
import { pageMetadata, breadcrumbLd, itemListLd, webPageLd } from "@/lib/seo";
import ServiceIcon from "@/components/ServiceIcon";
import LeadForm from "@/components/LeadForm";

export const metadata = pageMetadata({
  title: "Home Improvement Cost Guide and Contractor License Lookup",
  description: "Start with a local project range, inspect the sources, and check contractor records before requesting quotes.",
  path: "/",
  keywords: ["home improvement cost guide", "contractor license lookup", "local renovation costs", "home project estimates"],
});

export default function Home() {
  const services = listServices();
  const metros = listMetros();
  const featuredMetro = metros.find((metro) => metro.slug === "miami-fl") ?? metros[0];
  const featuredService = services.find((service) => service.slug === "hvac-replacement") ?? services[0];
  const featuredEstimate = getEstimate(featuredService.slug, featuredMetro.slug).estimate;
  const serviceLinks = services.map((service) => ({ name: service.shortName, href: `/services/${service.slug}` }));

  return <>
    <section className="hero">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <h1>Start with the number you can <strong>defend.</strong></h1>
          <p>Local planning ranges and public license records, organized before you hire.</p>
          <div className="hero-actions"><Link className="button" href="/costs">See project costs <ArrowRight size={17} aria-hidden /></Link><Link className="button secondary" href="/licenses">Check a license</Link></div>
          <div className="hero-note"><CheckCircle size={16} weight="fill" aria-hidden /> Estimates show their scope, inputs, and source notes.</div>
        </div>
        <div className="hero-media">
          <img className="hero-photo" src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85" alt="Modern home exterior with a covered entry and warm interior light" />
          <div className="evidence-sheet">
            <header><div><span className="sheet-location"><MapPin size={13} aria-hidden /> {featuredMetro.city}, {featuredMetro.state}</span><h2>{featuredService.shortName}</h2></div><span className="sheet-status">Planning range</span></header>
            <p className="sheet-price">{usd(featuredEstimate.low)} - {usd(featuredEstimate.high)}</p>
            <div className="sheet-meta"><div><strong>{usd(featuredEstimate.median)}</strong><span>modeled median</span></div><div><strong>{featuredService.durationDays}</strong><span>typical duration</span></div></div>
            <Link className="sheet-link" href={`/costs/${featuredService.slug}/${featuredMetro.slug}`}>Open the estimate <ArrowRight size={14} aria-hidden /></Link>
          </div>
        </div>
      </div>
    </section>


    <section className="home-section">
      <div className="wrap">
        <div className="section-heading"><h2>Choose the project first.</h2><p>A useful comparison starts with the same scope. Open a guide to see the range, assumptions, and local adjustment.</p></div>
        <div className="service-index">{services.map((service) => <Link className="service-row" href={`/services/${service.slug}`} key={service.slug}><span className="service-icon"><ServiceIcon trade={service.tradeSlug} size={20} /></span><span><h3>{service.shortName}</h3><p>{service.description.split(".")[0]}.</p></span><ArrowRight className="arrow" size={19} aria-hidden /></Link>)}</div>
      </div>
    </section>

    <section className="home-section">
      <div className="wrap story-grid">
        <div className="story-copy"><h2>A range is only useful when you can see what moves it.</h2><p>Every local page separates labor, materials, overhead, and permits. It also shows the housing-age, climate, and market factors behind the estimate.</p><Link className="text-link" href={`/costs/${featuredService.slug}/${featuredMetro.slug}`}>Read a real local estimate <ArrowRight size={16} aria-hidden /></Link></div>
        <div className="story-figure"><img className="story-photo" src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85" alt="Bright residential interior prepared for a renovation project" /></div>
      </div>
    </section>

    <section className="verify-band">
      <div className="wrap verify-grid"><div><h2>Verify the person behind the quote.</h2><p>Search a public record by company, license number, city, or trade. Then open the state authority source before signing.</p><Link className="button" href="/licenses">Open license lookup <ArrowRight size={17} aria-hidden /></Link></div><div className="source-ledger"><div className="source-ledger-row"><strong><Database size={17} aria-hidden /> Cost model</strong><span>National project benchmarks adjusted for the selected metro.</span></div><div className="source-ledger-row"><strong><FileText size={17} aria-hidden /> Public records</strong><span>License data is presented as an index, not official verification.</span></div><div className="source-ledger-row"><strong><ShieldCheck size={17} aria-hidden /> Clear limits</strong><span>Paid placement never changes a license status or modeled cost.</span></div></div></div>
    </section>

    <section className="home-section">
      <div className="wrap"><div className="metro-heading"><h2>Find your market.</h2><Link className="text-link" href="/costs">Compare all metros <ArrowRight size={16} aria-hidden /></Link></div><div className="metro-grid">{metros.slice(0, 12).map((metro) => <Link className="metro-link" href={`/costs/${featuredService.slug}/${metro.slug}`} key={metro.slug}><span>{metro.city}, {metro.state}</span><small>{featuredService.shortName}</small><ArrowRight size={16} aria-hidden /></Link>)}</div></div>
    </section>

    <section className="quote-section">
      <div className="wrap quote-grid"><div className="quote-copy"><h2>When you are ready, make the next call count.</h2><p>Bring a defined scope and a realistic range to the conversation. We can connect you with local contractors without asking you to commit.</p><ul><li><CheckCircle size={17} weight="fill" aria-hidden /> Tell us the project and location.</li><li><CheckCircle size={17} weight="fill" aria-hidden /> Receive a response from relevant pros.</li><li><CheckCircle size={17} weight="fill" aria-hidden /> Verify the credentials yourself.</li></ul></div><LeadForm compact /></div>
    </section>

    <section className="home-section compact contractor-note"><div className="wrap"><div><h2>Are you the contractor?</h2><p>Claim a public record, correct the details, and learn how DwellGauge handles paid placement.</p></div><Link className="button secondary" href="/get-listed">For contractors <ArrowRight size={16} aria-hidden /></Link></div></section>

    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([webPageLd({ name: "Home improvement cost guide and contractor license lookup", description: "Local home project estimates and public contractor license records.", path: "/" }), breadcrumbLd([{ name: "Home", href: "/" }]), itemListLd(serviceLinks)]) }} />
  </>;
}
