import { usd } from "@/lib/format";
import type { CostEstimate } from "@/lib/compute";

export default function CostCard({ estimate, metroName, updated = false }: { estimate: CostEstimate; metroName: string; updated?: boolean }) {
  const max = Math.max(...estimate.components.map((c) => c.amount), 1);
  return <div className="price-card">
    <div className="price-card-main">
      <div className="price-band">
        <div><p className="eyebrow">Typical range in {metroName}</p><div className="price">{usd(estimate.low)} - {usd(estimate.high)}</div><p className="muted small">Modeled median: <strong style={{ color: "var(--ink)" }}>{usd(estimate.median)}</strong></p></div>
        <span className="pill">{updated ? "Current data" : "Planning estimate"}</span>
      </div>
      <hr className="rule" />
      <h3>What is included</h3>
      {estimate.components.map((c) => <div className="component" key={c.label}><div className="component-label"><span>{c.label}</span><strong>{usd(c.amount)}</strong></div><div className="bar" aria-hidden="true"><i style={{ width: `${Math.max(5, c.amount / max * 100)}%` }} /></div></div>)}
    </div>
    <div className="price-card-note">Uses local wages, material factors, housing age, and permit allowances. This is a planning range, not a contractor quote.</div>
  </div>;
}
