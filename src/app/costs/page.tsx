import Link from "next/link";
import { ArrowRight } from "@/components/Icons";
import ServiceIcon from "@/components/ServiceIcon";
import { listServices, listMetros, getEstimate } from "@/lib/datasets";
import { usd } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Home Project Cost Guide",
  description: "Compare defined home project price ranges across HVAC, roofing, plumbing, electrical, and painting in 20 US metros.",
  path: "/costs",
  keywords: ["home project cost guide", "home improvement costs", "local renovation costs", "contractor price guide"],
});

export default function Costs() {
  const services = listServices();
  const metros = listMetros();

  return <>
    <div className="page-hero">
      <div className="wrap">
        <div className="breadcrumbs"><Link href="/">Home</Link> / Cost guide</div>
        <h1>Home project costs, by job and city.</h1>
        <p>Start with a defined scope. Then open a local page to see the modeled range, the factors behind it, and the questions worth taking to a contractor.</p>
      </div>
    </div>

    <section className="section">
      <div className="wrap cost-overview-grid">
        <div>
          <p className="record-count">{services.length} defined project scopes</p>
          <div className="index-list">
            {services.map((service) => <Link className="index-row" href={`/services/${service.slug}`} key={service.slug}>
              <span className="service-icon"><ServiceIcon trade={service.tradeSlug} size={20} /></span>
              <span><h3>{service.shortName}</h3><p>{service.description.split(".")[0]}.</p></span>
              <span><strong className="price">{usd(service.benchmark.low)} - {usd(service.benchmark.high)}</strong><span className="small muted">National planning range</span></span>
              <ArrowRight size={19} aria-hidden />
            </Link>)}
          </div>
        </div>
        <aside className="cost-guide-note">
          <h2>Use the same scope when you compare.</h2>
          <p>A roof replacement, repipe, or HVAC swap can mean different work from one quote to the next. Our guides define the project first so the range has a clear boundary.</p>
          <div className="callout"><h3>What every local page shows</h3><p className="small muted">Modeled median, local range, labor and materials factors, permit allowance, source links, and hiring questions.</p></div>
        </aside>
      </div>
    </section>

    <section className="home-section compact">
      <div className="wrap">
        <div className="section-head">
          <div><h2>Compare markets.</h2><p className="muted">Choose a city to compare the median across every defined project.</p></div>
          <Link className="text-link" href="/methodology">Read the method <ArrowRight size={16} aria-hidden /></Link>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Metro</th>{services.map((service) => <th key={service.slug}>{service.shortName}</th>)}</tr></thead>
            <tbody>{metros.map((metro) => <tr key={metro.slug}>
              <td><strong>{metro.city}, {metro.state}</strong></td>
              {services.map((service) => <td key={service.slug}><Link href={`/costs/${service.slug}/${metro.slug}`}>{usd(getEstimate(service.slug, metro.slug).estimate.median)}</Link></td>)}
            </tr>)}</tbody>
          </table>
          <p className="table-caption">Each amount is a modeled median for the defined project. Open a local guide for the full range and assumptions.</p>
        </div>
      </div>
    </section>
  </>;
}
