# Florida pilot launch

DwellGauge should launch first as a focused Florida pilot. This is a commercial validation phase, not a claim that the product already covers every state or every Florida trade.

## Pilot scope

Start with:

- Orlando
- Tampa
- Miami/Fort Lauderdale
- Jacksonville

Prioritize:

- HVAC replacement
- Roof replacement
- Plumbing and whole-home repipe
- Electrical panel upgrades when verified records and local supply are available

## Pre-launch commands

Run these in a staging environment first:

```bash
npm run pipeline:licenses-fl
npm run pipeline:compute
npm run pipeline:validate
npm run launch:check
npm run typecheck
npm test -- --run
npm run build
```

`launch:check` is the release gate. In production it requires the official Florida dataset, generated cost data, demo mode disabled, database configuration, and Stripe configuration. Wage and permit data produce warnings until their verified sources are configured; do not publish claims that depend on missing sources.

## Required production settings

Set these in the host secret manager, never in Git:

```env
NEXT_PUBLIC_SITE_URL=https://dwellgauge.com
NEXT_PUBLIC_DEMO_MODE=false
DATABASE_URL=...
AUTH_SECRET=...
ADMIN_PASSWORD=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_FEATURED_PRICE_ID=price_...
RESEND_API_KEY=...
LEAD_NOTIFY_EMAIL=...
FRESHNESS_MONITOR_TOKEN=...
```

Apply `db/schema.sql` and migrations `001` through `005`. Register the Stripe webhook and configure the daily freshness workflow before accepting live leads.

## Day-one acceptance checks

- `/api/health` returns healthy.
- `/api/health/data` reports Florida records and a current retrieval date.
- `/api/health/freshness` returns HTTP 200.
- `/licenses` returns real records with source links.
- A license-number lookup finds an imported record.
- A missing-record submission appears in `/admin`.
- A quote request is stored and notification delivery is confirmed.
- Stripe Checkout opens in test mode in staging and live mode only after webhook verification.
- Search Console verifies the domain and accepts `/sitemap.xml`.
- No sample record appears with `NEXT_PUBLIC_DEMO_MODE=false`.

## First 30 days

Recruit 20–30 contractors across the four pilot markets. Offer a free verified profile, then test one paid featured-listing plan and one qualified-lead plan. Keep every sponsored placement labeled.

Review weekly:

- Organic impressions and clicks
- Quote requests by service and metro
- Lead response rate
- Routed leads
- Won/lost outcomes
- Revenue by landing page
- Paid contractor activation and retention
- Data freshness failures

The first commercial milestone is 100 qualified quote requests, 20 active contractors, and 5 paid accounts. Do not expand nationally until the routing and payment loop works repeatedly.

## After the pilot

If the pilot meets the milestone, add Texas with a separate official adapter and state-specific review. Do not merge state records by guesswork. Each state requires its own licensing authority, source permission, field mapping, validation tests, update schedule, and public-source disclosure.
