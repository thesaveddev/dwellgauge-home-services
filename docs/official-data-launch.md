# Official contractor data launch

The application intentionally ships with synthetic records only. Production hides `sample-seed.json`; it will not claim a populated license directory until an official dataset is installed.

## Florida first market

1. Open the DBPR Construction Industry public-records page:
   https://www2.myfloridalicense.com/construction-industry/public-records/
2. Download the current license data file manually if automated access returns 403 or requires a browser session.
3. Store the downloaded file outside version control, or use an approved secure object-store URL.
4. Set `FL_LICENSE_DATA_URL` to a comma-separated list of `file:///...` paths or official HTTPS URLs.
5. Run:

```bash
npm run pipeline:licenses-fl
npm run pipeline:compute
```

The importer refuses to replace `data/licenses/fl.json` unless required columns map, at least one supported trade matches, all records are marked `sample: false`, and every record has the expected state code. It writes atomically, preserving the last good dataset on failure.

## Launch gates

- Confirm the source terms permit republication and linking.
- Preserve source URL and retrieval timestamp in `fl.json.meta`.
- Review a random sample against the state authority search tool.
- Check `/api/health/data` returns `ok: true` and the expected record count.
- Set `NEXT_PUBLIC_DEMO_MODE=false` in production.
- Do not publish empty, stale, synthetic, or untraceable records.
- Refresh on a documented schedule and alert when the dataset is older than the agreed freshness threshold.

If the public endpoint blocks automated access, do not bypass access controls. Use the state’s approved download process or request an authorized data feed.
