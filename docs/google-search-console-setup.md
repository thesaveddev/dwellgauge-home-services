# Google Search Console setup

## 1. Set the canonical URL

Set the production origin before building or deploying:

```env
NEXT_PUBLIC_SITE_URL=https://dwellgauge.com
```

The value must be HTTPS, canonical, and have no trailing slash. It is used by canonical tags, JSON-LD, `robots.txt`, `sitemap.xml`, and Open Graph URLs.

## 2. Verify the property

### Recommended: Domain property

1. Open https://search.google.com/search-console.
2. Choose **Add property**.
3. Select **Domain** and enter `dwellgauge.com` without `https://`.
4. Copy the TXT record Google provides.
5. Add that TXT record at your DNS provider for the root domain.
6. Wait for DNS propagation, then click **Verify**.

Domain verification covers HTTP/HTTPS variants and subdomains. It is the preferred method for a production site.

### Alternative: URL-prefix property

If DNS access is unavailable:

1. Add `https://dwellgauge.com/` as a URL-prefix property.
2. Choose **HTML tag** verification.
3. Copy the token from the `content` attribute.
4. Set it as a deployment secret:

```env
GOOGLE_SITE_VERIFICATION=your-token
```

5. Redeploy. The token is emitted in the page metadata, and the fallback endpoint is available at `/api/search-console/verify`.
6. Return to Search Console and click **Verify**.

Do not commit the token to source control. The DNS method is preferable because it does not require a public token in application configuration.

## 3. Submit the sitemap

After the site is deployed and publicly reachable:

1. Open the verified property.
2. Select **Sitemaps**.
3. Enter `sitemap.xml`.
4. Click **Submit**.

The complete sitemap URL is:

```text
https://dwellgauge.com/sitemap.xml
```

The site also advertises the sitemap in:

```text
https://dwellgauge.com/robots.txt
```

Do not submit `/api/search-console/verify`; it is only a verification fallback.

## 4. Validate indexability

Use **URL inspection** for:

- `/`
- `/costs`
- `/services/hvac-replacement`
- One real metro cost page
- One official contractor record
- `/methodology`
- `/tools/hvac-calculator`

For each URL, confirm:

- Google can fetch the URL.
- The page is not blocked by `robots.txt`.
- The page has a self-referencing canonical URL.
- The page is not marked `noindex`.
- Structured data is present and valid.
- The page contains real, useful content rather than a thin template.

## 5. Launch prerequisites

Before requesting indexing:

- Set `NEXT_PUBLIC_DEMO_MODE=false`.
- Load and validate official contractor records.
- Confirm `/api/health/data` is healthy.
- Confirm the production sitemap contains only intended public URLs.
- Confirm `/admin` and `/api` are disallowed in `robots.txt` and marked noindex.
- Test mobile rendering and Core Web Vitals.
- Confirm every public page returns HTTP 200.

## 6. Ongoing monitoring

Review Search Console weekly during launch:

- Pages indexed versus submitted.
- Crawl and indexing errors.
- Search impressions and clicks.
- Queries and average position.
- CTR by page.
- Core Web Vitals.
- Manual actions and security issues.

Submit individual URLs only for the first priority pages or after substantial updates. Let the sitemap discover the rest; repeated indexing requests do not improve rankings.
