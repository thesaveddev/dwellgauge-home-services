"use client";

import { useEffect, useState } from "react";

type Report = {
  days: number;
  generatedAt: string;
  searchConsole: { available: boolean; reason?: string; rows: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>; totals: { clicks: number; impressions: number; ctr: number; position: number } };
  conversions: { leads: number; quoteLeads: number; claims: number; newLeads: number; routedLeads: number; quoteRate: number; revenueCents: number; wonLeads: number; byPage: Array<{ page: string; leads: number; won: number; revenueCents: number }>; byService: Array<{ service: string; count: number }>; byMetro: Array<{ metro: string; count: number }> };
};

export default function ReportingPanel() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/admin/reporting?days=28").then(async (response) => { if (!response.ok) throw new Error("Unable to load reporting data."); setReport(await response.json()); }).catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load reporting data.")); }, []);
  if (error) return <div className="notice">{error}</div>;
  if (!report) return <div className="card"><p className="muted">Loading reporting data...</p></div>;
  const search = report.searchConsole.totals;
  return <section className="reporting-section" aria-labelledby="reporting-title">
    <div className="section-head"><div><span className="eyebrow">Acquisition</span><h2 id="reporting-title">Search and quote reporting</h2></div><span className="small muted">Last {report.days} days · updated {new Date(report.generatedAt).toLocaleString()}</span></div>
    <div className="stats reporting-stats">
      <div className="stat"><strong>{search.clicks.toLocaleString()}</strong><span>Organic clicks</span></div>
      <div className="stat"><strong>{search.impressions.toLocaleString()}</strong><span>Search impressions</span></div>
      <div className="stat"><strong>{(search.ctr * 100).toFixed(1)}%</strong><span>Search CTR</span></div>
      <div className="stat"><strong>{report.conversions.quoteLeads}</strong><span>Quote requests</span></div>
      <div className="stat"><strong>{report.conversions.routedLeads}</strong><span>Routed leads</span></div>
      <div className="stat"><strong>{report.conversions.wonLeads}</strong><span>Won leads</span></div>
      <div className="stat"><strong>${(report.conversions.revenueCents / 100).toLocaleString()}</strong><span>Attributed revenue</span></div>
    </div>
    {!report.searchConsole.available && <div className="notice" style={{ marginTop: 16 }}>Search Console is not connected. {report.searchConsole.reason}</div>}
    <div className="reporting-columns">
      <div className="card"><h3>Quote requests by service</h3>{report.conversions.byService.length ? <ul className="report-list">{report.conversions.byService.map((item) => <li key={item.service}><span>{item.service}</span><strong>{item.count}</strong></li>)}</ul> : <p className="muted">No quote requests yet.</p>}</div>
      <div className="card"><h3>Quote requests by market</h3>{report.conversions.byMetro.length ? <ul className="report-list">{report.conversions.byMetro.map((item) => <li key={item.metro}><span>{item.metro}</span><strong>{item.count}</strong></li>)}</ul> : <p className="muted">No market data yet.</p>}</div>
      <div className="card"><h3>Revenue by landing page</h3>{report.conversions.byPage.length ? <ul className="report-list">{report.conversions.byPage.slice(0, 10).map((item) => <li key={item.page}><span>{item.page}<br /><small>{item.leads} leads · {item.won} won</small></span><strong>${(item.revenueCents / 100).toLocaleString()}</strong></li>)}</ul> : <p className="muted">Record lead outcomes to see attribution.</p>}</div>
      <div className="card"><h3>Top organic queries</h3>{report.searchConsole.rows.length ? <ul className="report-list">{report.searchConsole.rows.slice(0, 8).map((row, index) => <li key={`${row.keys?.join("-")}-${index}`}><span>{row.keys?.[0] || "Unknown query"}</span><strong>{row.clicks ?? 0} clicks</strong></li>)}</ul> : <p className="muted">Connect Search Console to see query data.</p>}</div>
    </div>
  </section>;
}
