import { randomUUID } from "crypto";
import { getPool } from "#lib/mysql/db";
export async function logAudit(actor, action, entity, details) {
    await getPool().query(`INSERT INTO audit_logs (id, actorUid, actorEmail, action, entityType, entityId, entityLabel, details, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        randomUUID(),
        actor.uid,
        actor.email,
        action,
        entity.type,
        entity.id,
        entity.label ?? entity.id,
        JSON.stringify(details ?? {}),
        new Date(),
    ]);
}
export async function listAuditLogs(limit = 100) {
    const [rows] = await getPool().query("SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT ?", [limit]);
    return rows.map((row) => ({
        id: row.id,
        actorUid: row.actorUid,
        actorEmail: row.actorEmail,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        entityLabel: row.entityLabel,
        details: row.details,
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    }));
}
