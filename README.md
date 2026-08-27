# DwellGauge Home Services

A data-driven home-services directory that combines local project cost ranges,
public contractor license records, quote requests, and contractor monetization.

## Product surface

- Cost pages for five services across 20 US metros
- Location-adjusted estimates from service benchmarks, wages, materials, climate,
  housing age, and permit allowances
- Searchable contractor license index with claim requests
- Quote lead capture with consent, honeypot spam protection, rate limiting, and
  optional Resend notifications
- Protected `/admin` inbox for leads and claims
- Config-driven country registry with future hreflang and currency support
- Sitemap, robots, JSON-LD, health endpoint, and security headers

## Local development

```bash
npm install
copy .env.example .env.local
npm run dev
```

Use `NEXT_PUBLIC_DEMO_MODE=true` locally to display the clearly marked synthetic
license records. The local JSON lead store is for development only.

## Verification

```bash
npm run typecheck
npm test -- --run
npm run build
```

## Production deployment

Deploy the Next.js app to Vercel, Render, Fly.io, or another Node-compatible
host. Set these values in the platform secret manager:

- `NEXT_PUBLIC_SITE_URL`: the canonical HTTPS URL
- `NEXT_PUBLIC_DEMO_MODE=false`: required to hide synthetic records
- `DATABASE_URL`: your self-managed PostgreSQL TLS connection string
- `ADMIN_PASSWORD`: at least 16 random characters
- `AUTH_SECRET`: at least 32 random characters
- `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL`, and `LEAD_NOTIFY_FROM` if lead alerts
  are wanted
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and
  `NEXT_PUBLIC_STRIPE_FEATURED_PRICE_ID` for contractor subscriptions
- `GSC_SITE_URL` and `GSC_SERVICE_ACCOUNT_JSON` for the admin Search Console
  report. Create a Google Cloud service account, enable the Search Console API,
  grant the service-account email access to your verified Search Console
  property, and store the JSON credentials in the platform secret manager.

Apply `db/schema.sql` and migrations `001` through `006` to your self-managed PostgreSQL database. Run `npm run db:import-florida` to import the validated Florida license artifact. Follow [`docs/florida-postgres-migration.md`](docs/florida-postgres-migration.md) before cutover, and apply the database security controls in [`docs/database-security-hardening.md`](docs/database-security-hardening.md) before storing real homeowner information. The application enforces TLS and connection timeouts in production via `src/lib/db.ts`. Verify
`GET /api/health` returns `ok: true`, and test `/api/leads` with a real form in a
staging environment before launch.

## Official contractor data

The first launch market is Florida. The repository includes a safe DBPR importer,
but no official records are bundled. Follow [`docs/official-data-launch.md`](docs/official-data-launch.md)
to obtain an authorized current file, run validation, and verify `/api/health/data`
before turning off demo mode. The importer preserves the previous good file when
an endpoint fails.

## Data freshness monitoring

The protected admin dashboard includes freshness status for generated estimates,
wages, permits, and official license data. `/api/health/freshness` returns 200
only when all configured datasets are healthy and 503 when any is missing, stale,
or invalid. Configure `FRESHNESS_MONITOR_TOKEN` and the GitHub Actions secrets
listed in [`docs/data-freshness-operations.md`](docs/data-freshness-operations.md)
for daily production alerts.

## Configure BLS and permit data

The step-by-step configuration guide for removing the wage and permit warnings is in [`docs/configure-bls-permits.md`](docs/configure-bls-permits.md). In short, configure the current official BLS OEWS archives, select permitted official city/county permit datasets, run both pipelines, validate the generated files, and only then publish claims based on those inputs.

## Data refresh

The Florida source is the official DBPR Construction Industry public CSV:
`https://www2.myfloridalicense.com/sto/file_download/extracts/CONSTRUCTIONLICENSE_1.csv`.
Run:

```bash
npm run pipeline:licenses-fl
npm run pipeline:compute
```

The source URL and field aliases live in `data/sources/licenses-fl.json`. The
importer writes only after a successful parse and leaves the previous file intact
on failure. Never publish the synthetic seed as official data.

The BLS OEWS adapter downloads and validates official metropolitan and national wage workbooks, then writes source metadata and metro-to-national ratios. The permit adapter requires a verified official Socrata dataset plus explicit field mappings in `PERMITS_SOURCE_CONFIG`; it rejects malformed or unrelated rows. See [`docs/official-source-adapters.md`](docs/official-source-adapters.md) before configuring production refreshes.

## Monetization

1. Sell exclusive or featured placement to contractors by trade and metro.
2. Route qualified quote requests to verified contractors and charge per lead.

Attach the one-page comparison of lead-marketplace costs vs. DwellGauge when you
prospect: [`docs/competitive-brief.md`](docs/competitive-brief.md) (markdown)
and [`docs/competitive-brief-print.html`](docs/competitive-brief-print.html)
(print-ready PDF handout — open in browser and Ctrl+P → Save as PDF).
3. Offer free profile claims as the acquisition wedge, then sell recurring
   visibility and lead-routing packages.
4. Add search/display advertising only after the site has meaningful traffic.

Keep sponsored placement clearly labeled and never alter license status or cost
estimates for paying partners.

## SEO

Technical SEO, indexation rules, content requirements, and the Search Console launch sequence are documented in [`docs/seo-launch-checklist.md`](docs/seo-launch-checklist.md). Set `NEXT_PUBLIC_SITE_URL` before building so canonical URLs, JSON-LD, `robots.txt`, and `sitemap.xml` use the production HTTPS origin. Complete verification and sitemap submission using [`docs/google-search-console-setup.md`](docs/google-search-console-setup.md).

## Reporting

The protected `/admin` dashboard includes conversion reporting from stored quote
requests and claims, plus optional Google Search Console query data. Search
Console data is fetched server-side and never exposes credentials to browsers.
The report currently shows the last 28 days, top queries, clicks, impressions,
CTR, average position, quote volume, routing volume, and breakdowns by service
and metro.

## Stripe billing

Create a recurring Stripe Price for featured contractor placement and configure
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and
`NEXT_PUBLIC_STRIPE_FEATURED_PRICE_ID`. Register
`https://your-domain.com/api/billing/webhook` in Stripe for
`checkout.session.completed`, `customer.subscription.*`, and `invoice.*`
events. Apply `db/migrations/003-stripe-billing.sql` before production use.
Stripe webhooks are signature-verified and deduplicated; subscription state is
not trusted from the browser. Contractor billing is managed through Stripe's
Customer Portal at `/get-listed`.

## Florida pilot launch

The recommended first commercial launch is a controlled Florida pilot. Use the release gate and day-one acceptance checks in [`docs/florida-pilot-launch.md`](docs/florida-pilot-launch.md). Run `npm run launch:check` before deploying a production release.

## Launch checklist

The master Florida-pilot launch checklist is [`docs/launch-checklist.md`](docs/launch-checklist.md). It is ordered top to bottom: code green, hosting, database, secrets, data, payments, email, SEO, security, monitoring, pilot ops, day-one smoke tests, and week-one metrics.

## Florida pilot operations

Use [`docs/florida-pilot-playbook.md`](docs/florida-pilot-playbook.md) for the step-by-step release, prospecting, contractor onboarding, manual lead-routing, and weekly scorecard process. When you outreach, attach the one-page competitive brief [`docs/competitive-brief.md`](docs/competitive-brief.md) comparing Angi/Thumbtack/BuildZoom lead costs against DwellGauge. `npm run pilot:export-prospects` creates a local prospect worksheet from active Florida records without contacting anyone.

## US state expansion

Florida is currently the only live licensing market. Texas, California, New York, Georgia, and North Carolina are registered as planned sources with authority links and explicit access status. See [`docs/us-state-expansion.md`](docs/us-state-expansion.md), and run `npm run pipeline:validate-states` before changing a state to live.

## International expansion

`data/countries.json` is the market registry. US is the default root market;
future markets use country-prefixed paths, localized currencies, VAT rules, and
hreflang metadata. See [`docs/internationalization.md`](docs/internationalization.md)
and [`docs/contractor-outreach-playbook.md`](docs/contractor-outreach-playbook.md).
