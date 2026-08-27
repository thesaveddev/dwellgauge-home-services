"use client";

import Link from "next/link";
import { ArrowRight } from "@/components/Icons";
import { useState } from "react";
import { usd } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";

export default function HvacCalculator() {
  const [sqft, setSqft] = useState(1800);
  const [climate, setClimate] = useState("mixed");
  const [result, setResult] = useState<{ tons: number; low: number; high: number } | null>(null);

  function calculate(event: React.FormEvent) {
    event.preventDefault();
    const factor = climate === "hot" ? 1.25 : climate === "cold" ? 1.1 : 1;
    const tons = Math.max(1.5, Math.ceil(sqft / 600 * factor * 2) / 2);
    setResult({ tons, low: Math.round((6500 + tons * 700) / 50) * 50, high: Math.round((11000 + tons * 1000) / 50) * 50 });
  }

  const webApplicationLd = { "@context": "https://schema.org", "@type": "WebApplication", name: "DwellGauge HVAC Replacement Cost Calculator", url: absoluteUrl("/tools/hvac-calculator"), applicationCategory: "UtilitiesApplication", operatingSystem: "Any", isAccessibleForFree: true, description: "A rough HVAC system size and replacement budget calculator." };

  return <>
    <div className="page-hero"><div className="wrap"><div className="breadcrumbs"><Link href="/">Home</Link> / Tools / HVAC calculator</div><h1>HVAC replacement cost calculator.</h1><p>Get a rough system-size and budget starting point. A licensed HVAC professional should confirm sizing with a Manual J load calculation.</p></div></div>
    <section className="section"><div className="wrap tool-layout"><form className="form-card" onSubmit={calculate}><h2>Tell us about the home</h2><label className="field">Conditioned square footage<input type="number" min="400" max="15000" value={sqft} onChange={(event) => setSqft(Number(event.target.value))} /></label><label className="field">Climate<select value={climate} onChange={(event) => setClimate(event.target.value)}><option value="cold">Cold and heating-dominant</option><option value="mixed">Mixed and four seasons</option><option value="hot">Hot and cooling-dominant</option></select></label><button className="button full">Calculate rough size <ArrowRight size={16} aria-hidden /></button><p className="small muted" style={{ marginTop: 12 }}>The result is intentionally a conversation starter, not an equipment specification.</p></form><div className="tool-result" aria-live="polite">{result ? <div className="card"><span className="record-label">Rough starting point</span><div className="price tool-number">{result.tons} tons</div><p className="muted">Estimated installed replacement budget: <strong style={{ color: "var(--ink)" }}>{usd(result.low)} - {usd(result.high)}</strong></p><div className="callout"><strong>Ask for a Manual J calculation.</strong><p className="small muted" style={{ margin: "7px 0 14px" }}>Oversizing can cause humidity and comfort problems. Ask every installer to show the load calculation.</p><Link href="/get-quotes" className="button">Find a local pro <ArrowRight size={16} aria-hidden /></Link></div></div> : <div className="card"><h2>What the result can tell you</h2><p className="muted">The familiar one-ton-per-600-square-feet rule is only a starting point. Insulation, window area, orientation, duct leakage, and local design temperatures all matter.</p><h3 style={{ marginTop: 24 }}>Use it to prepare questions</h3><p className="muted">A typical central HVAC replacement often falls between $6,500 and $14,500 before local adjustments, equipment efficiency, access, and ductwork. Open the <Link className="muted-link" href="/services/hvac-replacement">HVAC replacement cost guide</Link> for metro-specific ranges.</p></div>}</div></div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationLd) }} />
  </>;
}
