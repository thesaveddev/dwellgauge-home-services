# Florida pilot — launch checklist

Work this top to bottom. Each item is done only when its acceptance check passes. Details live in the linked docs; this is the order of operations.

## Phase 0 — Code is green

- [ ] `npm run typecheck` passes
- [ ] `npm test -- --run` passes (9 tests)
- [ ] `npm run build` passes (136 routes)
- [ ] `npm run launch:check` passes (warnings for BLS/permits are acceptable only if no page claims wage/permit data)
- [ ] Committed, tagged release candidate

## Phase 1 — Hosting & domain

- [ ] App host chosen (Vercel, Render, Fly, or your VPS) and deploy pipeline works from Git
- [ ] Domain purchased and DNS pointed: `dwellgauge.com` → app host
- [ ] HTTPS certificate issued and auto-renewing
- [ ] Staging URL works (`staging.dwellgauge.com` or similar) and is separate from production
- [ ] `NEXT_PUBLIC_SITE_URL=https://dwellgauge.com` (no trailing slash) set before the production build
- [ ] Deploy a build, confirm homepage loads over HTTPS

## Phase 2 — Database (PostgreSQL)

Docs: [`docs/database-security-hardening.md`](database-security-hardening.md), [`docs/florida-postgres-migration.md`](florida-postgres-migration.md)

- [ ] Production Postgres running (your own server or VPS), reachable from the app host only
- [ ] Firewall: port 5432 restricted to app host + operator IP; no public `0.0.0.0/0`
- [ ] SSL enabled (`ssl = on`) on the server, `sslmode=require` or `verify-full` in the production URL
- [ ] Least-privilege roles created (`db/provision/least-privilege-roles.sql`): app (DML only), migrator (DDL), reader (read-only)
- [ ] `db/schema.sql` + migrations 001–006 applied
- [ ] `npm run db:import-florida` run in production with the verified `fl.json` artifact
- [ ] Acceptance: `select count(*) from licenses` returns 41,700; `dataset_imports` shows a `succeeded` row
- [ ] Daily encrypted backups scheduled (`scripts/db-backup.sh`) to a second location
- [ ] Weekly restore test scheduled (`scripts/db-restore-check.sh`)
- [ ] Staging and production databases/credentials are separate

## Phase 3 — Secrets & environment

Production secret manager must contain:

- [ ] `NEXT_PUBLIC_SITE_URL=https://dwellgauge.com`
- [ ] `NEXT_PUBLIC_DEMO_MODE=false`
- [ ] `DATABASE_URL` (TLS, app role)
- [ ] `AUTH_SECRET` (≥32 chars, `openssl rand -hex 32`)
- [ ] `ADMIN_PASSWORD` (≥16 chars)
- [ ] `STRIPE_SECRET_KEY` (live)
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_STRIPE_FEATURED_PRICE_ID`
- [ ] `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL`, `LEAD_NOTIFY_FROM`
- [ ] `FRESHNESS_MONITOR_TOKEN`
- [ ] `GOOGLE_SITE_VERIFICATION` (if using URL-prefix verification)
- [ ] `GSC_SITE_URL`, `GSC_SERVICE_ACCOUNT_JSON` (optional, for Search Console reporting)
- [ ] Acceptance: `/api/health` returns `ok:true` in production with no missing-secret errors

## Phase 4 — Data

Docs: [`docs/official-data-launch.md`](official-data-launch.md), [`docs/configure-bls-permits.md`](configure-bls-permits.md)

- [ ] Official Florida dataset imported (done locally: 41,700 records)
- [ ] Source URL + retrieval timestamp stored (in `dataset_imports` / `fl.json` meta)
- [ ] `/api/health/data` returns `ok:true`, `storage:postgres`, `count:41700`, `ageDays:0`
- [ ] `/api/health/freshness` returns HTTP 200 (or you have explicitly accepted the wage/permit warnings)
- [ ] License page copy only claims what the data supports
- [ ] Decision recorded: BLS wages + permit observations configured, or pages visibly avoid wage/permit claims
- [ ] Random sample of 25 records checked against the DBPR public search tool

## Phase 5 — Payments (Stripe)

Docs: README "Stripe billing" section

- [ ] Live mode enabled; test-mode keys not in production
- [ ] Featured price (`price_...`) created; recurring monthly
- [ ] Webhook endpoint registered: `https://dwellgauge.com/api/billing/webhook`
- [ ] Webhook events subscribed: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
- [ ] `db/migrations/003-stripe-billing.sql` applied (done)
- [ ] Customer Portal enabled in Stripe settings
- [ ] Acceptance: in staging, run a real test checkout → webhook → subscription row appears in DB; cancel from the portal → `subscription.deleted` recorded

## Phase 6 — Email

- [ ] `RESEND_API_KEY` configured; domain verified in Resend
- [ ] SPF, DKIM, DMARC records published for the sending domain
- [ ] Acceptance: submit a test lead → notification email arrives
- [ ] Lead inbox monitored daily (notification + `/admin`)

## Phase 7 — SEO & Search Console

Docs: [`docs/google-search-console-setup.md`](google-search-console-setup.md), [`docs/seo-launch-checklist.md`](seo-launch-checklist.md)

- [ ] Domain verified in Search Console (DNS TXT preferred)
- [ ] `https://dwellgauge.com/sitemap.xml` submitted
- [ ] `robots.txt` serves the sitemap and blocks `/admin`, `/api`
- [ ] Homepage, `/costs`, one service page, one metro page, one license record inspected via URL Inspection
- [ ] Canonicals, titles, JSON-LD render correctly on sampled pages
- [ ] Request indexing for: homepage, `/costs`, `/licenses`, each service guide, each pilot metro page
- [ ] No synthetic/sample records in the production sitemap (`NEXT_PUBLIC_DEMO_MODE=false`)
- [ ] GSC property linked so `/admin` reporting shows real queries

## Phase 8 — Security

Docs: [`docs/security-production-checklist.md`](security-production-checklist.md)

- [ ] CSP/HSTS/security headers verified on production responses
- [ ] Admin: MFA-capable identity provider, OR accept shared-password risk as pilot-only and rotate the password
- [ ] Rate limiting/bot protection at the edge (Vercel Firewall, Cloudflare, or equivalent)
- [ ] Admin access logged (`audit_logs`) and reviewed
- [ ] `npm audit` clean or accepted with known risk notes
- [ ] Secrets rotated from any defaults (`changeme`, etc.)

## Phase 9 — Monitoring & alerts

- [ ] `/api/health` monitored (uptime check)
- [ ] `/api/health/freshness` monitored (daily) — `.github/workflows/data-freshness-alert.yml` secrets configured: `PRODUCTION_SITE_URL`, `FRESHNESS_MONITOR_TOKEN`, `DATA_ALERT_WEBHOOK_URL`
- [ ] Error tracking / server logs visible to you
- [ ] Database logs forwarded; auth failures alerted
- [ ] Backup + restore alerting (failure of either pages an operator)

## Phase 10 — Pilot ops

Docs: [`docs/florida-pilot-playbook.md`](florida-pilot-playbook.md), [`docs/contractor-outreach-playbook.md`](contractor-outreach-playbook.md)

- [ ] `npm run pilot:export-prospects` → `data/runtime/florida-prospects.csv` (544 prospects found locally)
- [ ] First 50 prospects selected across Orlando, Tampa, Miami/Ft. Lauderdale, Jacksonville
- [ ] Only lawful public business contact details added; no inferred personal emails
- [ ] Outreach domain warmed; ≤20 emails/day/mailbox, Tue–Thu
- [ ] Offer locked: free verified profile + $99/mo featured (50% off first month for first 5 per market)
- [ ] Lead routing procedure documented and understood (manual routing first)
- [ ] `/admin` workflow: new lead → routed → contacted → won/lost → revenue

## Phase 11 — Day-one smoke test

Run this list against production on launch day:

- [ ] Homepage loads, hero + CTAs work
- [ ] `/costs` and one `[service]/[metro]` page load with prices
- [ ] `/licenses` search: exact license number, business name, city, trade filter, state dropdown
- [ ] License record page: status, dates, official verification link, "information only" disclaimer
- [ ] "Can't find your record?" form submits → appears in `/admin`
- [ ] Quote form submits → stored in Postgres + email notification
- [ ] Claim form submits → appears in `/admin`
- [ ] `/get-listed` → Stripe Checkout opens (test in staging, live after webhook verified)
- [ ] `/api/health`, `/api/health/data`, `/api/health/freshness` all healthy
- [ ] Sitemap + robots served; GSC shows the domain verified
- [ ] Mobile viewport (375px): no overflow, nav works, forms usable
- [ ] No sample records visible anywhere

## Phase 12 — Week-one metrics

Set a Monday review. Targets after 30 days:

- [ ] 50 prospects contacted
- [ ] 20 verified/claimed profiles
- [ ] 10 contractors receiving leads
- [ ] 100 qualified quote requests
- [ ] 5 paid accounts
- [ ] ≥60% contractor contact rate
- [ ] ≥3 documented won jobs
- [ ] Data freshness healthy the whole week

## Expansion gate

Do not add Texas or any other state until: 5+ paying contractors, repeated lead routing, documented won jobs, and a source-approved Texas adapter plan. Revenue data — not page count — decides expansion.
