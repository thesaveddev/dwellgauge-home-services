import Link from "next/link";
import { ArrowRight, WarningCircle } from "@/components/Icons";

export default function NotFound() {
  return <section className="section error-page"><div className="wrap"><WarningCircle size={34} color="var(--accent)" aria-hidden /><h1>That page is not in our records.</h1><p>Try the cost guide or search the public contractor license index.</p><div className="hero-actions"><Link className="button" href="/costs">Browse costs <ArrowRight size={16} aria-hidden /></Link><Link className="button secondary" href="/licenses">Search licenses <ArrowRight size={16} aria-hidden /></Link></div></div></section>;
}
