alter table if exists leads add column if not exists consent_at timestamptz;
alter table if exists claims add column if not exists consent_at timestamptz;
