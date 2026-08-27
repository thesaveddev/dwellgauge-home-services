create table if not exists leads (
  id text primary key,
  type text not null check (type in ('quote','claim','subscribe')),
  status text not null default 'new' check (status in ('new','routed','archived')),
  name text, email text, phone text, message text,
  service_slug text, metro_slug text, license_ref text,
  landing_path text, utm_source text, utm_medium text, utm_campaign text,
  assigned_contractor text, routed_at timestamptz,
  outcome text check (outcome in ('new','contacted','won','lost')),
  revenue_cents integer check (revenue_cents is null or revenue_cents >= 0), currency text,
  outcome_at timestamptz,
  consent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists leads_created_at_idx on leads (created_at desc);
create table if not exists claims (
  id text primary key,
  license_id text not null,
  business_name text not null,
  contact_name text not null,
  email text not null,
  phone text, message text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  consent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists claims_created_at_idx on claims (created_at desc);
