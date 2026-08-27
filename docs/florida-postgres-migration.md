# Florida JSON to PostgreSQL migration

The Florida DBPR JSON file remains the validated import artifact. PostgreSQL becomes the production system of record after the migration and import succeed.

## 1. Create the database

Set a TLS connection string locally or in the deployment secret manager:

```env
DATABASE_URL=postgresql://dwellgauge_app:password@your-db-host:5432/dwellgauge?sslmode=require
```

Do not commit this value.

## 2. Apply schema and migrations

Using your approved PostgreSQL migration process, apply:

```text
db/schema.sql
db/migrations/001-consent-at.sql
db/migrations/002-claim-license-null.sql
db/migrations/003-stripe-billing.sql
db/migrations/004-audit-logs.sql
db/migrations/005-lead-attribution-outcomes.sql
db/migrations/006-florida-licenses.sql
```

The application role should be able to read and write application rows but should not create extensions, roles, or tables. Apply migrations with a separate migration role.

## 3. Import the current Florida dataset

From the project root:

```bash
npm run db:import-florida
```

The importer:

- Reads `data/licenses/fl.json`.
- Re-validates every record as Florida data.
- Requires source URL and retrieval metadata.
- Opens a transaction.
- Upserts by `(state_code, license_number)`.
- Records the import in `dataset_imports`.
- Rolls back the entire operation on failure.

Never truncate the table before importing. The upsert allows a failed or partial run to leave the previous database state intact.

## 4. Verify the import

Run these queries:

```sql
select count(*) from licenses where state_code = 'FL';
select trade, count(*) from licenses where state_code = 'FL' group by trade order by trade;
select status, count(*) from licenses where state_code = 'FL' group by status order by status;
select * from dataset_imports where state_code = 'FL' order by imported_at desc limit 5;
```

Compare the count and trade distribution with `data/licenses/fl.json`. Manually verify a random sample against the Florida DBPR source.

## 5. Production cutover

The current application still uses the JSON artifact for public license reads. Before switching reads to Postgres, implement and test the database-backed `searchLicenses`, `getLicense`, and state-count accessors in a staging deployment.

Cut over only when:

- The import succeeded.
- Query results match the JSON artifact for sampled IDs and searches.
- Pagination and query limits work.
- Health checks verify database connectivity.
- No production fallback silently uses JSON.
- The sitemap is generated from verified database IDs or a controlled ID export.

Keep the JSON artifact in private release storage for rollback and reproducibility; do not use it as an unannounced production fallback.

## Operational rules

- Refresh the DBPR source through the existing validated pipeline.
- Import into staging first.
- Review count deltas and random records.
- Promote the same validated artifact to production.
- Monitor query latency, connection exhaustion, failed imports, and freshness.
- Back up PostgreSQL and test restores before deleting any JSON artifacts.
