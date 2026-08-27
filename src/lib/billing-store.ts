import fs from "node:fs";
import path from "node:path";
import { assertProductionConfig } from "./config";
import { createPool } from "./db";

export interface SubscriptionState { customerId: string; subscriptionId?: string; status: string; priceId?: string; currentPeriodEnd?: string; updatedAt: string; }
export interface BillingStore { hasEvent(id: string): Promise<boolean>; recordEvent(id: string, type: string): Promise<void>; upsertSubscription(state: SubscriptionState): Promise<void>; listSubscriptions(): Promise<SubscriptionState[]>; }

class JsonBillingStore implements BillingStore {
  private file(name: string) { const dir = path.join(process.cwd(), "data", "runtime"); fs.mkdirSync(dir, { recursive: true }); return path.join(dir, name); }
  private read<T>(name: string): T[] { try { return JSON.parse(fs.readFileSync(this.file(name), "utf8")); } catch { return []; } }
  private write<T>(name: string, value: T[]) { fs.writeFileSync(this.file(name), JSON.stringify(value, null, 2)); }
  async hasEvent(id: string) { return this.read<{ id: string }>("stripe-events.json").some((event) => event.id === id); }
  async recordEvent(id: string, type: string) { const rows = this.read<{ id: string; type: string; receivedAt: string }>("stripe-events.json"); rows.push({ id, type, receivedAt: new Date().toISOString() }); this.write("stripe-events.json", rows.slice(-5000)); }
  async upsertSubscription(state: SubscriptionState) { const rows = this.read<SubscriptionState>("subscriptions.json"); const index = rows.findIndex((row) => row.customerId === state.customerId); if (index === -1) rows.unshift(state); else rows[index] = { ...rows[index], ...state }; this.write("subscriptions.json", rows); }
  async listSubscriptions() { return this.read<SubscriptionState>("subscriptions.json"); }
}

class PgBillingStore implements BillingStore {
  private pool = createPool(3);
  async hasEvent(id: string) { const result = await this.pool.query(`select 1 from stripe_events where id = $1`, [id]); return (result.rowCount ?? 0) > 0; }
  async recordEvent(id: string, type: string) { await this.pool.query(`insert into stripe_events (id, type) values ($1, $2) on conflict (id) do nothing`, [id, type]); }
  async upsertSubscription(state: SubscriptionState) { await this.pool.query(`insert into subscriptions (customer_id, subscription_id, status, price_id, current_period_end, updated_at) values ($1,$2,$3,$4,$5,$6) on conflict (customer_id) do update set subscription_id=$2,status=$3,price_id=$4,current_period_end=$5,updated_at=$6`, [state.customerId, state.subscriptionId ?? null, state.status, state.priceId ?? null, state.currentPeriodEnd ?? null, state.updatedAt]); }
  async listSubscriptions() { const result = await this.pool.query(`select customer_id as "customerId", subscription_id as "subscriptionId", status, price_id as "priceId", current_period_end as "currentPeriodEnd", updated_at as "updatedAt" from subscriptions order by updated_at desc limit 500`); return result.rows as SubscriptionState[]; }
}

let store: BillingStore | null = null;
export function getBillingStore(): BillingStore { if (!store) { assertProductionConfig(); store = process.env.DATABASE_URL ? new PgBillingStore() : new JsonBillingStore(); } return store; }
