import { assertProductionConfig } from "./config";
import { createPool } from "./db";

export type AuditEvent = { actor: string; action: string; entityType: string; entityId?: string; metadata?: Record<string, unknown>; ip?: string };

export async function recordAudit(event: AuditEvent): Promise<void> {
  try {
    assertProductionConfig();
    if (!process.env.DATABASE_URL) return;
    const pool = createPool(1);
    await pool.query(`insert into audit_logs (actor, action, entity_type, entity_id, metadata, ip_address) values ($1,$2,$3,$4,$5,$6)`, [event.actor, event.action, event.entityType, event.entityId ?? null, JSON.stringify(event.metadata ?? {}), event.ip ?? null]);
    await pool.end();
  } catch (error) {
    console.error("audit log failed", error);
  }
}
