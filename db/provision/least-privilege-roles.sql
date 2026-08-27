-- Least-privilege role provisioning. Run as the database superuser (or a
-- role with CREATEROLE) once per environment: staging and production must use
-- separate databases, separate credentials, and never share roles.
--
-- Replace the three passwords with values from your secret manager. Passwords
-- must be long, random, unique per environment, and rotated on a schedule.

create role dwellgauge_app login password 'replace-with-a-long-random-password';
create role dwellgauge_migrator login password 'replace-with-a-long-random-password';
create role dwellgauge_reader login password 'replace-with-a-long-random-password';

-- The application role must not be able to create tables, extensions, or roles.
grant connect on database dwellgauge to dwellgauge_app;
grant usage on schema public to dwellgauge_app;

-- Migrations need DDL but only inside their own database/schema.
grant connect on database dwellgauge to dwellgauge_migrator;
grant create on database dwellgauge to dwellgauge_migrator;
grant create on schema public to dwellgauge_migrator;

-- Read-only role for reporting, monitoring, and backup validation.
grant connect on database dwellgauge to dwellgauge_reader;
grant usage on schema public to dwellgauge_reader;

-- DML for the app role on current and future tables.
grant select, insert, update, delete on all tables in schema public to dwellgauge_app;
grant usage on all sequences in schema public to dwellgauge_app;
alter default privileges for role dwellgauge_migrator in schema public
  grant select, insert, update, delete on tables to dwellgauge_app;
alter default privileges for role dwellgauge_migrator in schema public
  grant usage on sequences to dwellgauge_app;

-- Read-only for the reporting role on current and future tables.
grant select on all tables in schema public to dwellgauge_reader;
alter default privileges for role dwellgauge_migrator in schema public
  grant select on tables to dwellgauge_reader;

-- Optional: restrict the app role to row-level behavior where needed.
-- Example: revoke delete on audit_logs so the application cannot erase history.
revoke delete on table audit_logs from dwellgauge_app;

-- Verify after running migrations:
--   select grantee, privilege_type from information_schema.role_table_grants
--   where table_name = 'licenses' order by grantee, privilege_type;
