create extension if not exists pg_trgm;

create table if not exists licenses (
  id text primary key,
  state_code char(2) not null check (state_code = 'FL'),
  license_number text not null,
  business_name text not null,
  trade text not null,
  classification text,
  status text not null check (status in ('active','inactive','expired','unknown')),
  issued_at date,
  expires_at date,
  city text,
  county text,
  bonded boolean,
  insured boolean,
  complaints integer,
  sample boolean not null default false check (sample = false),
  source_url text not null,
  retrieved_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (state_code, license_number)
);
create index if not exists licenses_fl_trade_idx on licenses (trade);
create index if not exists licenses_fl_city_idx on licenses (city);
create index if not exists licenses_fl_number_idx on licenses (license_number);
create index if not exists licenses_fl_business_name_trgm_idx on licenses using gin (lower(business_name) gin_trgm_ops);

create table if not exists dataset_imports (
  id uuid primary key default gen_random_uuid(),
  dataset text not null,
  state_code char(2),
  source_url text not null,
  retrieved_at timestamptz not null,
  imported_at timestamptz not null default now(),
  record_count integer not null check (record_count >= 0),
  status text not null check (status in ('started','succeeded','failed')),
  error_message text
);
create index if not exists dataset_imports_lookup_idx on dataset_imports (dataset, state_code, imported_at desc);
