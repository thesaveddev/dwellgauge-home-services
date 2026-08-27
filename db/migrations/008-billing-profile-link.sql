-- Link a claimed contractor profile to its Stripe customer.
-- Subscription state remains authoritative in subscriptions; this is only the
-- association needed to activate the correct listing after payment succeeds.
alter table if exists contractor_profiles
  add column if not exists billing_customer_id text;

create index if not exists contractor_profiles_billing_customer_idx
  on contractor_profiles (billing_customer_id)
  where billing_customer_id is not null;
