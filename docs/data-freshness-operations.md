# Data freshness operations

The admin dashboard now includes a **Dataset freshness** section. It reads the same production files used by public pages and reports status, age, record counts, and validation state.

## Thresholds

| Dataset | Healthy threshold | Failure condition |
|---|---:|---|
| Cost estimates | 45 days | Missing, invalid, or older than 45 days |
| Wage ratios | 120 days | Missing or older than 120 days |
| Permit observations | 120 days | Missing or older than 120 days |
| Florida license records | 45 days | Missing, invalid, or older than 45 days |

`/api/health/freshness` returns HTTP 200 only when every dataset is healthy. It returns HTTP 503 if any dataset is missing, stale, or invalid, which makes it suitable for uptime monitors and CI alerts.

## Scheduled alerting

`.github/workflows/data-freshness-alert.yml` checks production daily. Configure these GitHub Actions secrets:

- `PRODUCTION_SITE_URL`: for example `https://dwellgauge.com`
- `FRESHNESS_MONITOR_TOKEN`: the same random token configured in production
- `DATA_ALERT_WEBHOOK_URL`: Slack, Teams, PagerDuty, or another HTTPS webhook

If the token is set, the endpoint requires `Authorization: Bearer <token>`. Keep the token out of browser code and source control.

## Response procedure

1. Open `/admin` and inspect the Dataset freshness panel.
2. Identify the failing source and read its error details.
3. Check the source authority and terms of use.
4. Run the relevant pipeline in staging.
5. Review record counts, timestamps, schema, duplicates, and a random sample.
6. Publish only after validation succeeds.
7. Confirm `/api/health/freshness` returns 200.
8. Record the incident and source change in the release log.

A stale dataset must not be silently relabeled as current. If a source is unavailable, keep the last known-good file where appropriate and communicate its age internally; do not publish synthetic replacement records as official data.
