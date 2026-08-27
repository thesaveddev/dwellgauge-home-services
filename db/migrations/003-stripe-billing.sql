create table if not exists stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);
create table if not exists subscriptions (
  customer_id text primary key,
  subscription_id text,
  status text not null,
  price_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_status_idx on subscriptions (status);
