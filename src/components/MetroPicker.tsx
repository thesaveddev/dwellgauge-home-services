import Link from "next/link";
import type { Metro } from "@/lib/datasets";

export default function MetroPicker({ serviceSlug, metros, current }: { serviceSlug: string; metros: Metro[]; current?: string }) {
  return <div className="card"><h3>Choose your city</h3><p className="muted small">See the local estimate and permit assumptions for each metro.</p><div className="metro-picker">{metros.map((m) => <Link key={m.slug} href={`/costs/${serviceSlug}/${m.slug}`} className={m.slug === current ? "current" : ""}>{m.city}, {m.state}</Link>)}</div></div>;
}
