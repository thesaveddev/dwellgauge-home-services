"use client";

import { useEffect, useState } from "react";

type Dataset = { name: string; status: "healthy" | "stale" | "missing" | "invalid"; ageDays?: number; maxAgeDays: number; records?: number; details?: string; source?: string };
export default function FreshnessPanel() {
  const [data, setData] = useState<{ datasets: Dataset[]; checkedAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/health/freshness").then(async (response) => { const payload = await response.json(); if (!response.ok && !payload.datasets) throw new Error("Unable to check dataset health."); setData(payload); }).catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to check dataset health.")); }, []);
  if (error) return <div className="notice">{error}</div>;
  if (!data) return <div className="card"><p className="muted">Checking dataset freshness...</p></div>;
  return <section className="freshness-section" aria-labelledby="freshness-title"><div className="section-head"><div><span className="eyebrow">Data operations</span><h2 id="freshness-title">Dataset freshness</h2></div><span className="small muted">Checked {new Date(data.checkedAt).toLocaleString()}</span></div><div className="freshness-list">{data.datasets.map((dataset) => <div className="freshness-row" key={dataset.name}><div><strong>{dataset.name}</strong><span className="small muted">{dataset.details || "Validated dataset"}</span></div><div className="freshness-meta"><span>{dataset.records !== undefined ? `${dataset.records.toLocaleString()} records` : "No records"}</span><span className={`freshness-status freshness-${dataset.status}`}>{dataset.status}</span><span className="small muted">{dataset.ageDays !== undefined ? `${dataset.ageDays}d old / ${dataset.maxAgeDays}d limit` : "No timestamp"}</span></div></div>)}</div></section>;
}
