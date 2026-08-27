import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@/components/Icons";
import { notFound } from "next/navigation";
import { getService, latestEstimateDate, listEstimatesForService } from "@/lib/datasets";
import { dateStr, usd } from "@/lib/format";
import { CURRENT_YEAR } from "@/lib/site";
import { pageMetadata, breadcrumbLd, faqLd, itemListLd, serviceLd, webPageLd } from "@/lib/seo";
import LeadForm from "@/components/LeadForm";

export async function generateStaticParams() {
  const { listServices } = await import("@/lib/datasets");
  return listServices().map((service) => ({ service: service.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  const record = getService(service);
  return record ? pageMetadata({
    title: `How Much Does ${record.name} Cost? ${CURRENT_YEAR} Guide`,
    description: `See the typical ${record.name.toLowerCase()} price range, local metro estimates, project scope, timeline, permit expectations, and questions to ask before hiring.`,
    path: `/services/${service}`,
    keywords: [`${record.name.toLowerCase()} cost`, `${record.name.toLowerCase()} price`, `${record.tradeSlug} cost guide`, "home improvement costs"],
    dateModified: latestEstimateDate() ?? undefined,
  }) : {};
}

export default async function ServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service: slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const estimates = await listEstimatesForService(slug);
  const updatedAt = latestEstimateDate();
  const updatedLabel = updatedAt ? dateStr(updatedAt) : "monthly when source data is available";
  const tradeName = service.tradeSlug === "hvac" ? "HVAC" : `${service.tradeSlug[0].toUpperCase()}${service.tradeSlug.slice(1)}`;
  const servicePath = `/services/${service.slug}`;
  const metroLinks = estimates.map(({ metro }) => ({ name: `${service.shortName} cost in ${metro.city}, ${metro.state}`, href: `/costs/${service.slug}/${metro.slug}` }));

  return <>
    <div className="page-hero">
      <div className="wrap">
        <div className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/costs">Costs</Link> / {service.shortName}</div>
        <h1>How much does {service.name} cost?</h1>
        <p>{service.description} Use the national range as a starting point, then open your metro for a location-adjusted estimate.</p>
        <p className="record-count">Guide updated {updatedLabel}.</p>
      </div>
    </div>

    <section className="section">
      <div className="wrap content-grid">
        <div>
          <div className="benchmark-panel">
            <span className="record-label">National planning range</span>
            <div className="price">{usd(service.benchmark.low)} - {usd(service.benchmark.high)}</div>
            <p>Defined as {service.benchmark.basis}. Typical duration: {service.durationDays}. {service.permitTypical ? "A permit is typically required." : "A permit is not typically required."}</p>
          </div>

          <div className="section-block">
            <h2>Local {service.shortName.toLowerCase()} costs</h2>
            <p className="muted">Choose a metro to see its modeled median, range, adjustments, permit allowance, and source notes.</p>
            <div className="table-wrap"><table className="data-table"><thead><tr><th>Metro</th><th>Typical range</th><th>Median</th></tr></thead><tbody>{estimates.map(({ metro, low, median, high }) => <tr key={metro.slug}><td><Link href={`/costs/${service.slug}/${metro.slug}`}>{metro.city}, {metro.state}</Link></td><td>{usd(low)} - {usd(high)}</td><td><strong>{usd(median)}</strong></td></tr>)}</tbody></table></div>
          </div>

          <div className="section-block">
            <h2>Questions to take to a {tradeName} contractor</h2>
            <div className="faq-list">{service.faqs.map((faq) => <div className="faq" key={faq.q}><h3>{faq.q}</h3><p className="muted">{faq.a}</p></div>)}</div>
          </div>

          <div className="section-block">
            <h2>Scope and sources</h2>
            <p className="muted">The benchmark defines a consistent project so cities can be compared. Local pages adjust labor, materials, housing age, climate where relevant, and permit allowances. Read the <Link className="muted-link" href="/methodology">full methodology</Link> before using a range in a budget.</p>
            <div className="source-list">{service.sources.map((source) => <div className="source-line" key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}<ArrowUpRight size={14} aria-hidden /></a></div>)}</div>
          </div>
        </div>
        <aside className="side-card"><LeadForm serviceSlug={service.slug} compact /></aside>
      </div>
    </section>

    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
      webPageLd({ name: `How much does ${service.name} cost?`, description: service.description, path: servicePath }),
      breadcrumbLd([{ name: "Home", href: "/" }, { name: "Costs", href: "/costs" }, { name: service.shortName, href: servicePath }]),
      faqLd(service.faqs),
      serviceLd(service, { path: servicePath }),
      itemListLd(metroLinks),
    ]) }} />
  </>;
}
