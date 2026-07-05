import { adminDb } from "#lib/firebase/admin";
import { DB_PROVIDER } from "#lib/db-provider";
import * as mysqlAudit from "#lib/mysql/audit";
export async function logAudit(actor, action, entity, details) {
    if (DB_PROVIDER === "mysql")
        return mysqlAudit.logAudit(actor, action, entity, details);
    await adminDb.collection("auditLogs").add({
        actorUid: actor.uid,
        actorEmail: actor.email,
        action,
        entityType: entity.type,
        entityId: entity.id,
        entityLabel: entity.label ?? entity.id,
        details: details ?? {},
        createdAt: new Date().toISOString(),
    });
}
