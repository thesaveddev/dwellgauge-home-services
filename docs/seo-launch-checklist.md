# SEO launch checklist

The application now emits canonical URLs, metadata, Open Graph/Twitter cards, JSON-LD, robots rules, a crawl-prioritized sitemap, and noindex directives for private or faceted pages. These technical signals make the site eligible to rank; they do not guarantee a first-page position.

## Before deployment

1. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin, with no trailing slash, before running the production build. This value is used by canonical tags, JSON-LD, `robots.txt`, and `sitemap.xml`.
2. Set `NEXT_PUBLIC_DEMO_MODE=false` and verify that synthetic license records are absent from the build and sitemap.
3. Load official license data for every published state. Do not publish a page whose record is synthetic, empty, or not traceable to an official source.
4. Apply the Postgres schema and migrations, then confirm `/api/health` returns `ok: true` in production.
5. Run `npm run typecheck`, `npm test -- --run`, and `npm run build` in the release environment.

## Search Console setup

Follow [`docs/google-search-console-setup.md`](google-search-console-setup.md) for DNS or URL-prefix verification, sitemap submission, URL inspection, and monitoring. In brief:

1. Verify the HTTPS domain in Google Search Console using the domain property.
2. Submit `https://YOUR-DOMAIN/sitemap.xml`.
3. Inspect the homepage, one service guide, one metro cost page, and one license record with URL Inspection.
4. Confirm each indexable page has one canonical URL, `index, follow`, a useful title and description, and rendered JSON-LD.
5. Confirm `/robots.txt` exposes the production sitemap and disallows `/admin` and `/api`.
6. Request indexing for the homepage, `/costs`, each service guide, and the first set of highest-value metro pages. Let the sitemap discover the rest.

## What should be indexable

- The homepage and `/costs` hub.
- One authoritative guide per service.
- A metro page only when it contains real, current local inputs and a meaningful explanation of why that market differs.
- A contractor record only when it comes from an official source, has a stable identifier, and contains enough current information to help a user verify the business.
- The methodology and genuinely useful tools.

Filtered license searches, admin pages, claim forms, and other conversion utilities are deliberately `noindex` to keep crawl budget focused on durable public content.

## Content needed for first-page competition

Technical SEO cannot overcome weak or copied pages. For every service and metro combination, maintain:

- A clearly defined project scope and answer-first price range.
- At least one local fact that changes the estimate, such as wage data, permit allowance, materials factor, climate, or housing age.
- A visible calculation explanation and links to the underlying government or industry source.
- Questions homeowners actually ask, answered from the defined scope.
- Links to nearby metros, related services, the methodology, license lookup, and quote flow.
- A visible update date that changes only when the underlying dataset changes.

Do not activate hundreds of near-identical city pages with guessed data. Expand one trade and one region at a time, watch indexation and engagement, then add the next cluster.

## Authority and distribution

- Earn links from local trade associations, municipalities, housing newsletters, journalists, and contractors who claim their profiles.
- Publish original data studies such as quarterly metro cost comparisons, permit trends, or license-status change reports.
- Build relationships with contractors and local organizations instead of relying on directory submissions alone.
- Keep paid placements labeled and separate from organic ranking signals.

## Monthly review

Track Search Console impressions, clicks, average position, indexing exclusions, Core Web Vitals, organic quote conversion rate, and the percentage of pages with real refreshed data. Improve or remove pages that receive impressions but no clicks, have stale sources, or provide no answer beyond a template.
