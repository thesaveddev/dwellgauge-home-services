export const SITE_NAME = "DwellGauge Home Services";
export const SITE_TAGLINE = "Clear project costs & verified contractor records";
export const SITE_LOCALE = "en-US";
export const CURRENT_YEAR = new Date().getFullYear();

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
  .trim()
  .replace(/\/$/, "");

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true" && process.env.NODE_ENV !== "production";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function licensePath(id: string): string {
  return `/licenses/${encodeURIComponent(id)}`;
}

const STATE_AUTHORITY_URLS: Record<string, string> = {
  FL: "https://www2.myfloridalicense.com/construction-industry/public-records/",
  TX: "https://www.tdlr.texas.gov/LicenseSearch/",
};

export function stateAuthorityUrl(stateCode: string): string {
  return STATE_AUTHORITY_URLS[stateCode.toUpperCase()] ?? "https://www.usa.gov/state-consumer";
}

export const TRADES_NAV = [
  { href: "/services/hvac-replacement", label: "HVAC replacement" },
  { href: "/services/roof-replacement", label: "Roof replacement" },
  { href: "/services/whole-home-repipe", label: "Repipe" },
  { href: "/services/electrical-panel-upgrade", label: "Panel upgrade" },
  { href: "/services/interior-painting", label: "Interior painting" },
];
