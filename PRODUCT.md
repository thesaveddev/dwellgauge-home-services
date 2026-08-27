# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Inferred from the brief and existing public workflows: homeowners researching an expensive repair or improvement project, usually before requesting quotes. A secondary audience is licensed contractors who want to claim a public listing or receive qualified inquiries.

## Product Purpose

DwellGauge helps homeowners understand local project costs and check public contractor license records before they hire. Success means a homeowner can move from uncertainty to a better-informed quote request without mistaking a planning estimate for a bid.

## Positioning

Evidence before hiring: the product combines location-adjusted planning ranges with public licensing records and source notes in one homeowner workflow.

## Operating Context

A homeowner is comparing a project scope, a local price range, permit expectations, and contractor credentials on a phone or laptop. The public site connects cost guides, metro pages, a license lookup, an HVAC calculator, quote requests, and a contractor claim flow.

## Capabilities and Constraints

- Existing public routes and slugs must continue working.
- Existing cost estimates, source links, license lookup, quote form, claim form, legal pages, SEO metadata, and admin workflows must remain functional.
- Cost ranges are planning estimates, not bids or guarantees.
- Public license records must be traceable to an official source; synthetic records must remain clearly labeled and hidden from production.
- No payment provider, automated contractor billing, or verified customer proof is currently present.
- Keep existing form field names and consent behavior.

## Brand Commitments

The product name is DwellGauge Home Services. The voice should be plain, specific, and transparent. Do not fabricate testimonials, customers, awards, data coverage, or performance claims.

## Evidence on Hand

- Five defined home-service project guides in `data/services.json`.
- Twenty modeled US metros in `data/metros.json`.
- Generated cost estimates under `data/generated/`.
- Synthetic license examples under `data/licenses/sample-seed.json`; no official license file is currently present in the workspace.
- Existing source links, methodology copy, quote form, claim flow, and public SEO routes.
- No approved photography or customer proof assets are present.

## Product Principles

1. Show the scope before showing the number.
2. Explain the source and the uncertainty.
3. Help homeowners verify before they commit.
4. Keep paid placement separate from factual data.
5. Prefer a useful next action over marketing language.

## Accessibility & Inclusion

Public forms must retain visible labels, keyboard access, consent links, readable contrast, responsive layouts, and clear loading, success, empty, and error states.
