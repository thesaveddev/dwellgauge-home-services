import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@/components/Icons";
import { notFound } from "next/navigation";
import { getService, getMetro, listServices, listMetros, getEstimate } from "@/lib/datasets";
import { usd, pct, dateStr } from "@/lib/format";
import { CURRENT_YEAR } from "@/lib/site";
import { pageMetadata, breadcrumbLd, faqLd, datasetLd, serviceLd, webPageLd } from "@/lib/seo";
import CostCard from "@/components/CostCard";
import MetroPicker from "@/components/MetroPicker";
import LeadForm from "@/components/LeadForm";
import ServiceIcon from "@/components/ServiceIcon";

export async function generateStaticParams() {
  const paths: { service: string; metro: string }[] = [];
  for (const service of listServices()) for (const metro of listMetros()) paths.push({ service: service.slug, metro: metro.slug });
  return paths;
}

export async function generateMetadata({ params }: { params: Promise<{ service: string; metro: string }> }) {
  const { service, metro } = await params;
  const record = getService(service);
  const location = getMetro(metro);
  if (!record || !location) return {};
  const { estimate, stored } = getEstimate(service, metro);
  return pageMetadata({
    title: `${record.shortName} Cost in ${location.city}, ${location.state} (${CURRENT_YEAR})`,
    description: `Plan for ${usd(estimate.low)} to ${usd(estimate.high)} for ${record.name.toLowerCase()} in ${location.city}, ${location.state}. See the median, local factors, source notes, and hiring questions.`,
    path: `/costs/${service}/${metro}`,
    keywords: [`${record.shortName.toLowerCase()} cost ${location.city}`, `${record.tradeSlug} contractor ${location.city}`, `${record.name.toLowerCase()} price ${location.state}`, "home improvement cost"],
    dateModified: stored?.computedAt,
  });
}

export default async function CostPage({ params }: { params: Promise<{ service: string; metro: string }> }) {
  const { service: slug, metro: metroSlug } = await params;
  const service = getService(slug);
  const metro = getMetro(metroSlug);
  if (!service || !metro) notFound();

  const { estimate, stored } = getEstimate(slug, metroSlug);
  const related = listServices().filter((record) => record.slug !== service.slug).slice(0, 4);
  const path = `/costs/${service.slug}/${metro.slug}`;
  const costAnswer = `In ${metro.city}, plan on ${usd(estimate.low)} to ${usd(estimate.high)} for a typical ${service.name.toLowerCase()} project, with a modeled median of ${usd(estimate.median)}.`;
  const updated = stored?.computedAt ? dateStr(stored.computedAt) : "monthly when source data is available";

  return <>
    <div className="page-hero">
      <div className="wrap">
        <div className="breadcrumbs"><Link href="/">Home</Link> / <Link href="/costs">Costs</Link> / <Link href={`/services/${service.slug}`}>{service.shortName}</Link> / {metro.city}</div>
        <h1>How much does {service.name} cost in {metro.city}?</h1>
        <p>{costAnswer} The range accounts for local wages, material costs, housing age, climate, and typical permits in {metro.city}, {metro.stateName}.</p>
        <p className="record-count">Estimate updated {updated}.</p>
      </div>
    </div>

    <section className="section">
      <div className="wrap content-grid">
        <div>
          <CostCard estimate={estimate} metroName={`${metro.city}, ${metro.state}`} updated={Boolean(stored)} />

          <div className="section-block">
            <h2>What changes the price in {metro.city}?</h2>
            <div className="split-note"><div><h3>Local wages</h3><p>{estimate.adjustments.wageRatio === 1 ? "The national baseline is in use until the next wage refresh." : `${Math.round(estimate.adjustments.wageRatio * 100)}% of the national trade average.`}</p><h3>Materials factor</h3><p>{Math.round(estimate.adjustments.materialsFactor * 100)}% of the national materials baseline.</p></div><div><h3>Housing age</h3><p>{pct(metro.pre1980Share)} of homes are pre-1980, with a {pct(estimate.adjustments.ageComplexity)} modeled complexity adjustment.</p><h3>Permit allowance</h3><p>{service.permitTypical ? usd(estimate.adjustments.permitFee) : "Not typically required for this project."}</p></div></div>
          </div>

          <div className="section-block">
            <h2>How we calculated this {metro.city} estimate</h2>
            <p className="muted">We start with a defined national project, adjust the labor portion with metropolitan wage data, adjust materials for the market, and apply modest housing-age and climate factors. Permit fees are planning allowances based on published local schedules. These numbers help with budgeting; they are not quotes.</p>
            <div className="source-list">{service.sources.map((source) => <div className="source-line" key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}<ArrowUpRight size={14} aria-hidden /></a></div>)}</div>
            <p className="small muted" style={{ marginTop: 14 }}>See the complete <Link className="muted-link" href="/methodology">DwellGauge methodology</Link>.</p>
          </div>

          <div className="section-block">
            <h2>{service.shortName} questions</h2>
            <div className="faq-list">{service.faqs.map((faq) => <div className="faq" key={faq.q}><h3>{faq.q}</h3><p className="muted">{faq.a}</p></div>)}</div>
          </div>

          <div className="section-block">
            <h2>Other home project costs in {metro.city}</h2>
            <div className="index-list">{related.map((record) => <Link className="index-row" href={`/costs/${record.slug}/${metro.slug}`} key={record.slug}><span className="service-icon"><ServiceIcon trade={record.tradeSlug} size={19} /></span><span><h3>{record.shortName}</h3><p>{record.description.split(".")[0]}.</p></span><ArrowRight size={18} aria-hidden /></Link>)}</div>
          </div>
        </div>
        <aside className="side-card"><MetroPicker serviceSlug={service.slug} metros={listMetros()} current={metro.slug} /><div style={{ marginTop: 16 }}><LeadForm serviceSlug={service.slug} metroSlug={metro.slug} compact /></div></aside>
      </div>
    </section>

    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
      webPageLd({ name: `${service.shortName} cost in ${metro.city}, ${metro.state}`, description: costAnswer, path }),
      breadcrumbLd([{ name: "Home", href: "/" }, { name: "Costs", href: "/costs" }, { name: service.shortName, href: `/services/${service.slug}` }, { name: metro.city, href: path }]),
      faqLd(service.faqs),
      datasetLd({ name: `${service.name} cost data - ${metro.city}`, description: costAnswer, path, keywords: [service.name, metro.city, metro.state, "home improvement cost"], dateModified: stored?.computedAt }),
      serviceLd(service, { path, city: metro.city, state: metro.state }),
    ]) }} />
  </>;
}
