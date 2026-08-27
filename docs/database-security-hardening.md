# Database security hardening

These controls apply to the self-managed PostgreSQL server. Code-level enforcement is in `src/lib/db.ts` (TLS, timeouts, pool limits) and `db/provision/` (roles, audit logging). The remaining items are server configuration and operational procedures.

## 1. TLS for every connection

The application enforces this: in production, `DATABASE_URL` must include `sslmode=require`, `verify-ca`, or `verify-full` for non-loopback hosts or the process refuses to start (`src/lib/db.ts`). Loopback (`localhost`, `127.0.0.1`, `::1`) is exempt because the traffic never leaves the machine — required for local development builds that run with `NODE_ENV=production`. All pools go through `createPool`.

Server side:

```conf
# postgresql.conf
ssl = on
ssl_cert_file = '/etc/postgresql/16/main/server.crt'
ssl_key_file = '/etc/postgresql/16/main/server.key'
ssl_min_protocol_version = 'TLSv1.3'
```

Prefer `verify-full` with a server certificate signed by a trusted CA. Distribute the CA to the application host and set `sslrootcert` in the connection string. Revoke any `sslmode=disable` or `allow` usage.

## 2. Firewall: restrict inbound traffic

Allow PostgreSQL only from the application server's IP (or private network). Never from `0.0.0.0/0`.

Example (ufw):

```bash
ufw default deny incoming
ufw allow 22/tcp
ufw allow from <app-server-ip> to any port 5432
ufw enable
```

On the app host, allow outbound only to the database host:port. Use a security group / network ACL if the provider supports it. Add a second rule for the operator workstation used by backup/restore jobs; consider a VPN instead of exposing 5432 publicly at all.

## 3. Disable public PostgreSQL access

Bind to private interfaces only:

```conf
# postgresql.conf
listen_addresses = '10.0.0.5'   # private IP, not 0.0.0.0
```

Restrict authentication in `pg_hba.conf`. Prefer SCRAM and host rules scoped to the app network:

```
hostssl dwellgauge dwellgauge_app 10.0.0.10/32 scram-sha-256
hostssl all all 0.0.0.0/0 reject
```

Enable `password_encryption = scram-sha-256`. Remove `md5` and `trust` rules. If the provider offers a private network, use it and do not create a public endpoint.

## 4. Separate staging and production

- Separate databases: `dwellgauge_staging` and `dwellgauge`.
- Separate credentials (never the same password).
- Separate PostgreSQL clusters or at least separate hosts when possible.
- Never point staging code at the production database and never export production data into staging without a scrubbing/review step.
- The backup scripts tag files by environment name; keep production archives in a different bucket/path from staging.

## 5. Rotate credentials

- Use long random passwords (recommend `openssl rand -base64 32`).
- Rotate on a schedule (e.g., every 90 days) and immediately after any suspected exposure or personnel change.
- Rotation procedure: generate a new password, update the secret manager, `alter role dwellgauge_app with password '...'`, then verify the app reconnects before removing the old value.
- Store credentials only in the platform secret manager, never in the repository, build logs, or shell history.

## 6. Least-privilege roles

Apply `db/provision/least-privilege-roles.sql` as superuser:

- `dwellgauge_app`: connect + DML only; cannot create tables, extensions, or roles; cannot delete from `audit_logs`.
- `dwellgauge_migrator`: DDL within the database only; used by the migration step.
- `dwellgauge_reader`: read-only; used by reporting, monitoring, and restore validation.

Default privileges are set so future tables created by the migrator automatically grant the right access. Verify with:

```sql
select grantee, privilege_type from information_schema.role_table_grants
where table_name in ('licenses','leads','audit_logs') order by grantee, privilege_type;
```

## 7. Encrypted backups

Run `scripts/db-backup.sh` daily (cron or CI). It:

- Dumps with `pg_dump --format=custom`.
- Encrypts with AES-256-CBC using `BACKUP_PASSPHRASE` from the secret manager.
- Writes a `sha256` integrity file.
- Prunes archives older than `BACKUP_RETENTION_DAYS`.

Example cron:

```cron
0 2 * * * BACKUP_DIR=/var/backups/dwellgauge BACKUP_PASSPHRASE=... DATABASE_URL=... bash /srv/dwellgauge/scripts/db-backup.sh >> /var/log/dwellgauge-backup.log 2>&1
```

Copy the encrypted archives to a second location (object storage or another host) that is not on the database server. Keep the passphrase and the hashes separate from the archive. Consider server-side `pg_basebackup`/WAL archiving for point-in-time recovery in addition to the daily logical dump.

## 8. Retention and deletion policies

- Backups: keep daily for 30 days, weekly for 12 weeks, monthly for 12 months (the script's retention prunes by age; layer the tiering with separate directories/scripts if needed).
- Logs: rotate daily, retain 90 days, then archive encrypted.
- Personal data: define a deletion policy for `leads`/`claims` (e.g., purge records older than X after the contract/job is complete) and document the request path for homeowner deletion rights.
- Never delete the latest known-good backup before a successful restore test.

Deletion example (run by a privileged role, after review):

```sql
delete from leads where outcome = 'lost' and outcome_at < now() - interval '18 months';
```

## 9. Log administrative access

Apply `db/provision/postgresql-audit.conf` (requires `pgaudit`) and reload. It logs:

- Every connection and disconnection (`log_connections`).
- DDL, role changes, and writes (`pgaudit.log = 'write, role, ddl'`).
- Parameter values and relation names for audit lines.

Forward `postgresql-*.log` to a central log sink (host log agent, SIEM, or log bucket) with access restricted to operators. Monitor for failed logins and `pg_hba.conf` rejections; alert on repeated authentication failures.

## 10. Test restore procedures

Run `scripts/db-restore-check.sh` on a schedule (weekly, and after any schema change):

- Decrypts the newest backup.
- Validates `pg_restore --list`.
- Restores into a throwaway `dwellgauge_restore_test_*` database.
- Counts `licenses` and `leads`.
- Drops the scratch database and cleans up.

A backup that has never been restored is not a backup. Record each successful test (date, archive, counts) in an operations log.

## 11. Patch PostgreSQL and the operating system

- Track the distribution's security advisories.
- Subscribe to PostgreSQL security announcements: https://www.postgresql.org/support/security/
- Apply minor-version updates promptly (they include security fixes).
- Schedule maintenance windows for major upgrades; test the upgrade path in staging first (including a restore test after the upgrade).
- Patch the OS monthly or sooner for critical CVEs, and keep `openssl`, `pgaudit`, and backup tooling updated.
- After patching, re-run: connection check, backup, restore test, freshness check, and a smoke test of the application.

## Verification checklist

- [ ] `DATABASE_URL` requires TLS; app refuses insecure strings in production.
- [ ] PostgreSQL bound to private interface; firewall allows only app host and operators.
- [ ] No `trust`/`md5` auth; SCRAM + TLS only.
- [ ] Staging and production databases and credentials are separate.
- [ ] Three least-privilege roles applied; app cannot DDL or delete audit logs.
- [ ] Daily encrypted backups with retention and off-server copies.
- [ ] Logs rotated and forwarded; admin/DDL/connection activity logged.
- [ ] Weekly restore test passes with documented counts.
- [ ] Retention/deletion policy documented and applied.
- [ ] Patch schedule tracked; upgrades tested in staging.
