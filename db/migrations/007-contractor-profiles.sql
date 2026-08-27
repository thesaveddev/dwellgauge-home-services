-- Migrations 007: contractor profiles (the marketing layer).
--
-- License facts stay in `licenses` (system of record). This table holds only the
-- marketing content a contractor controls *after* an approved claim: service
-- areas, services offered in their own words, hours, website, contact, a tagline,
-- and placement flags. It never duplicates or overrides source-controlled fields.
--
-- featured / verified are output flags we set, not the contractor. featured==true
-- is granted when their subscription is active; verified==true after an approved
-- ownership claim. These are intentionally separated from license.status.

create table if not exists contractor_profiles (
  license_id text primary key,
  status text not null default 'claimed' check (status in ('claimed','approved','live')),
  tagline text,
  website text,
  email text,
  phone text,
  service_areas text[] not null default '{}',
  services_offered text[] not null default '{}',
  hours text,
  about text,
  verified boolean not null default false,
  featured boolean not null default false,
  billing_customer_id text,
  revised_by text,
  revised_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists contractor_profiles_status_idx
  on contractor_profiles (status);

create index if not exists contractor_profiles_verified_idx
  on contractor_profiles (verified);

create index if not exists contractor_profiles_featured_idx
  on contractor_profiles (featured) where featured = true;

create index if not exists contractor_profiles_billing_customer_idx
  on contractor_profiles (billing_customer_id)
  where billing_customer_id is not null;

-- Changes to marketing fields are administrative events worth an audit trail.
create or replace function contractor_profiles_touch() returns trigger as $$
begin
  new.revised_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists contractor_profiles_touch on contractor_profiles;
create trigger contractor_profiles_touch
  before update on contractor_profiles
  for each row execute function contractor_profiles_touch();