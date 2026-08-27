# Florida pilot: operator playbook

This is the sequence for turning the current product into a small, measurable Florida business. Do not expand the geography until the loop works.

## Phase 1 — Choose the launch slice

Use four markets:

- Orlando
- Tampa
- Miami/Fort Lauderdale
- Jacksonville

Use four services:

- HVAC replacement
- Roof replacement
- Plumbing/repipe
- Electrical panel upgrade, only where verified record coverage and contractor supply are sufficient

Create one launch sheet with one row per market/service pair. Record: page URL, official data date, number of visible records, recruited contractors, leads, routed leads, won jobs, and revenue.

## Phase 2 — Release the site

1. Load the authorized Florida DBPR export.
2. Run `npm run pipeline:licenses-fl`.
3. Run `npm run pipeline:compute`.
4. Run `npm run pipeline:validate`.
5. Run `npm run launch:check`.
6. Set production secrets and `NEXT_PUBLIC_DEMO_MODE=false`.
7. Apply the database schema and migrations.
8. Test one quote, one missing-record request, one claim, one Stripe test checkout, and one webhook.
9. Verify Search Console, sitemap, robots, source links, retrieval dates, status labels, and the information-only disclaimer.
10. Deploy and check the same flows on the production domain.

Do not announce all of Florida if the useful contractor supply is limited to four metros.

## Phase 3 — Build the prospect list

Run:

```bash
npm run pilot:export-prospects
```

This creates `data/runtime/florida-prospects.csv` containing active records matching the pilot cities and trades. It does not send email or publish contact details. Enrich the sheet manually or through a lawful business-data provider. Do not infer email addresses or use personal contact data without a lawful basis.

Prioritize contractors in this order:

1. Active license and matching pilot city.
2. Trade with a high project value.
3. A public website or business contact channel.
4. A profile that already receives organic exposure.
5. Clear service-area fit and responsive contact details.

Start with 50 prospects: roughly 12–13 per market. Add more only after the first group is processed.

## Phase 4 — Make the offer

Use one simple offer and one test price:

- Free verified profile and correction review.
- Featured placement: $99/month, clearly labeled.
- First-month pilot: 50% off for the first five paid contractors in each market.
- Quote leads: route manually at first; do not promise exclusivity until supply and volume justify it.

Explain what payment cannot change: license status, source data, complaints, public facts, or modeled costs.

## Phase 5 — Outreach sequence

Send a small, personalized sequence to 10–20 prospects per weekday. Use the existing outreach playbook, but personalize the live profile URL, license number, market, and service.

Track:

- Contacted date
- Channel
- Replied
- Verification requested
- Profile corrected
- Pilot accepted
- Paid
- Churned
- Notes and consent/opt-out state

Stop immediately on opt-out. Avoid bulk sending from a new domain; configure SPF, DKIM, and DMARC first.

## Phase 6 — Contractor onboarding

For each interested contractor:

1. Send the public profile and official source link.
2. Verify ownership using a business email, website match, or other documented evidence.
3. Review requested corrections against the official source.
4. Keep the public-record fields source-controlled.
5. Record service areas, response hours, and lead-routing preferences separately.
6. Send the Stripe Checkout link for the featured plan.
7. Confirm the subscription through the webhook, not the browser.
8. Run a test lead and confirm the contractor receives it.
9. Get explicit permission before using their logo, testimonials, or marketing copy.

## Phase 7 — Operate leads manually first

For every homeowner request:

1. Review for completeness and obvious spam.
2. Assign a suitable contractor.
3. Mark the lead routed.
4. Record whether the contractor contacted the homeowner.
5. Record won/lost and revenue when known.
6. Follow up with the contractor after 24–48 hours.

Manual routing is intentional. It reveals the real matching rules before automation is built.

## Weekly scorecard

Review every Monday:

```text
visits by market/service
→ quote conversion rate
→ qualified requests
→ routed within 15 minutes
→ contractor contact rate
→ won jobs
→ reported revenue
→ paid accounts
→ contractor retention
```

Suggested pilot targets after 30 days:

- 50 active contractor prospects contacted
- 20 verified or claimed profiles
- 10 contractors receiving leads
- 100 qualified quote requests
- 5 paid accounts
- At least 60% contractor contact rate
- At least 3 documented won jobs

If traffic exists but quote conversion is low, improve the page and form. If quote requests exist but contractors do not respond, improve supply and routing. If contractors respond but do not pay, change the offer before adding more states.

## Expansion gate

Do not add Texas until the Florida pilot has repeated lead routing, at least five paying contractors, documented outcomes, and a source-approved Texas adapter plan. Revenue and response data—not page count—decide expansion.
