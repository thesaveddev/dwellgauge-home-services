import countriesData from "@/../data/countries.json";

/**
 * Market registry — the single source of truth for international expansion.
 *
 * Adding a country is configuration, not code:
 *   1. Set status "live" here (data/countries.json).
 *   2. Add per-country datasets (benchmarks, wage ratios, licenses) under data/.
 *   3. Add locale strings for translated pages (see docs/internationalization.md).
 * Routing, hreflang, sitemaps, and money formatting pick it up automatically.
 */

export type CountryStatus = "live" | "planned";
export type PriceDisplay = "incl" | "excl";

export interface Country {
  code: string;
  name: string;
  locale: string;
  currency: string;
  vatRate?: number;
  priceDisplay: PriceDisplay;
  status: CountryStatus;
  default?: boolean;
}

const countries = countriesData.countries as Country[];

export function listCountries(status?: CountryStatus): Country[] {
  return status ? countries.filter((c) => c.status === status) : countries;
}

export function liveCountries(): Country[] {
  return listCountries("live");
}

export function defaultCountry(): Country {
  return countries.find((c) => c.default) ?? countries[0];
}

export function getCountry(code: string): Country | undefined {
  return countries.find((c) => c.code === code.toLowerCase());
}

/** Country-scoped URL prefix: root stays the default market ("us"). */
export function countryPath(code: string, path: string): string {
  const country = getCountry(code);
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (!country || country.default) return clean;
  return `/${country.code}${clean === "/" ? "" : clean}`;
}

/** hreflang alternates across every live market; x-default points at the default market. */
export function hreflangAlternates(path: string): Record<string, string> | undefined {
  const live = liveCountries();
  if (live.length <= 1) return undefined;
  const map: Record<string, string> = {};
  for (const c of live) map[c.locale.replace("_", "-")] = absoluteCountryUrl(c.code, path);
  map["x-default"] = absoluteCountryUrl(defaultCountry().code, path);
  return map;
}

function absoluteCountryUrl(code: string, path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${countryPath(code, path)}`;
}

/** Locale- and currency-aware money formatting. */
export function formatMoney(amount: number, country: Country = defaultCountry(), opts: { cents?: boolean } = {}): string {
  return new Intl.NumberFormat(country.locale, {
    style: "currency",
    currency: country.currency,
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  }).format(amount);
}

/** Suffix shown next to prices, e.g. "incl. VAT" in EU markets. */
export function priceSuffix(country: Country = defaultCountry()): string | null {
  if (country.priceDisplay !== "incl" || !country.vatRate) return null;
  return `incl. ${Math.round(country.vatRate * 100)}% VAT`;
}
