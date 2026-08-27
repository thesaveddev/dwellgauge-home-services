# Internationalization & market expansion

Expansion is **configuration, not code**. The site ships US-only; every layer
below already understands multiple markets and activates them automatically.

## The registry: `data/countries.json`

Each market is one entry:

```json
{ "code": "de", "name": "Deutschland", "locale": "de-DE", "currency": "EUR",
  "vatRate": 0.19, "priceDisplay": "incl", "status": "planned" }
```

- `status: "live"` activates the market in hreflang alternates, sitemap
  alternates, and money formatting. A market should only be marked live after
  its localized route templates and verified datasets are deployed.
- `priceDisplay: "incl" | "excl"` controls whether prices show VAT-inclusive
  (EU convention) or pre-tax (US/CA convention). `priceSuffix()` renders the
  "incl. 19% VAT" label.

## URL strategy

Path-prefixed by country code; the default market stays at the root so existing
US rankings are never touched:

| Market | URL |
|---|---|
| United States (default) | `/costs/hvac-replacement/tampa-fl` |
| UK (when live) | `/uk/costs/roof-replacement/london` |
| Germany (when live) | `/de/costs/dach/westfalen` |

Helpers in `src/lib/intl.ts`: `countryPath()`, `hreflangAlternates()`,
`formatMoney(amount, country)`, `liveCountries()`.

## What flips when a market goes live

1. Set `"status": "live"` for the country.
2. Add its datasets — benchmarks per service, wage ratios from that country's
   statistics office, license/trade register sync under `data/licenses/`.
3. Translate page copy (`en` strings currently live inline; migrate to
   `messages/{locale}.json` dictionaries when the second language lands).
4. hreflang `alternates.languages` + `x-default` emit automatically on every
   page and in `sitemap.xml`.

The compute engine and SEO plumbing are market-agnostic. The country-specific
route/data adapter remains an explicit launch step so the site never publishes
translated URLs backed by US data or unverified prices.

## Regional data source map (for step 2)

| Market | Cost inputs | Trade/company verification |
|---|---|---|
| 🇺🇸 US | BLS OEWS metro wages; city permit schedules | State license boards (FL script shipped: `npm run pipeline:licenses-fl`) |
| 🇨🇦 Canada | StatCan wage tables; provincial permit data | Provincial trade registries (e.g., BC Technical Safety, Ontario Skilled Trades Ontario) |
| 🇬🇧 UK | ONS ASHE earnings; local authority planning fees | Companies House API (free), Gas Safe register, FMB membership |
| 🇩🇪 Germany | Destatis earnings; regional Baukosten indices | Handwerksrolle / Handelsregister; Meister-brief as trust signal |

## Compliance notes

- **EU/UK lead forms:** add explicit consent checkbox + privacy notice at point
  of capture (GDPR); store consent timestamp with each lead (`leads.consent_at`
  column when EU goes live).
- **VAT:** B2C price displays must be VAT-inclusive in EU markets — handled by
  `priceDisplay`.
- **Cookies:** admin dashboard uses one strictly-necessary session cookie; add a
  consent banner only if you later add analytics cookies in the EU.

## Launch order recommendation

US → Canada (same language, similar data) → UK (proven directory demand) →
Germany (high prices, strong verification culture). One market per quarter once
the previous one produces revenue.
