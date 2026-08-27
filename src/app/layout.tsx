import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, HouseLine, List, MagnifyingGlass } from "@/components/Icons";
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SITE_LOCALE, SITE_NAME, SITE_TAGLINE, SITE_URL, absoluteUrl } from "@/lib/site";
import { organizationLd, websiteLd } from "@/lib/seo";
import TrackingScripts from "@/components/TrackingScripts";
import { safeJsonLd } from "@/lib/security";

const displayFont = Space_Grotesk({ subsets: ["latin"], variable: "--font-display-face", display: "swap", weight: ["500", "600", "700"] });
const bodyFont = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-body-face", display: "swap", weight: ["400", "500", "600", "700"] });
const monoFont = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono-face", display: "swap", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  icons: { icon: "/icon.svg" },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: SITE_NAME,
    description: SITE_TAGLINE,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: SITE_LOCALE.replace("-", "_"),
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_TAGLINE,
    images: [absoluteUrl("/opengraph-image")],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang={SITE_LOCALE} className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
    <body>
      <header className="site-header">
        <div className="wrap nav-wrap">
          <Link className="brand" href="/" aria-label="DwellGauge home">
            <span className="brand-mark"><HouseLine size={19} weight="regular" aria-hidden /></span>
            <span><strong>DwellGauge</strong><small>HOME SERVICES</small></span>
          </Link>
          <nav className="site-nav" aria-label="Primary navigation">
            <Link href="/costs">Cost guide</Link>
            <Link href="/licenses">License lookup</Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/get-listed">For contractors</Link>
            <Link className="nav-cta" href="/get-quotes">Request quotes <ArrowRight size={15} aria-hidden /></Link>
          </nav>
          <details className="mobile-nav">
            <summary><List size={18} aria-hidden /> Menu</summary>
            <nav className="mobile-nav-panel" aria-label="Mobile navigation">
              <Link href="/costs"><MagnifyingGlass size={17} aria-hidden /> Cost guide</Link>
              <Link href="/licenses"><BookOpen size={17} aria-hidden /> License lookup</Link>
              <Link href="/how-it-works"><BookOpen size={17} aria-hidden /> How it works</Link>
              <Link href="/tools/hvac-calculator"><MagnifyingGlass size={17} aria-hidden /> HVAC calculator</Link>
              <Link href="/get-listed"><HouseLine size={17} aria-hidden /> For contractors</Link>
              <Link href="/get-quotes"><ArrowRight size={17} aria-hidden /> Request quotes</Link>
            </nav>
          </details>
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <div className="wrap footer-grid">
          <div>
            <Link className="brand footer-brand" href="/">
              <span className="brand-mark"><HouseLine size={19} weight="regular" aria-hidden /></span>
              <span><strong>DwellGauge</strong><small>HOME SERVICES</small></span>
            </Link>
            <p className="footer-copy">A clearer first step for expensive home projects. Read the scope, inspect the sources, and choose your next call.</p>
          </div>
          <div><h4>Research</h4><Link href="/costs">Cost guide</Link><Link href="/licenses">License lookup</Link><Link href="/tools/hvac-calculator">HVAC calculator</Link><Link href="/data-sources">Data sources</Link></div>
          <div><h4>Decide</h4><Link href="/how-it-works">How it works</Link><Link href="/methodology">Methodology</Link><Link href="/faq">Common questions</Link><Link href="/get-quotes">Request quotes</Link></div>
          <div><h4>Participate</h4><Link href="/get-listed">For contractors</Link><Link href="/claim">Claim a profile</Link><Link href="/about">About DwellGauge</Link><Link href="/contact">Contact</Link></div>
        </div>
        <div className="wrap footer-bottom"><span>Copyright {new Date().getFullYear()} DwellGauge Home Services</span><span><Link href="/privacy">Privacy</Link> <Link href="/terms">Terms</Link> <Link href="/disclaimer">Disclaimer</Link></span></div>
      </footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd([websiteLd(), organizationLd()]) }} />
      <TrackingScripts />
    </body>
  </html>;
}
