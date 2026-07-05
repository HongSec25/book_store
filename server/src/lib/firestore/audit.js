import { adminDb } from "#lib/firebase/admin";
import { DB_PROVIDER } from "#lib/db-provider";
import * as mysqlAudit from "#lib/mysql/audit";
export async function listAuditLogs(limit = 100) {
    if (DB_PROVIDER === "mysql")
        return mysqlAudit.listAuditLogs(limit);
    const snap = await adminDb.collection("auditLogs").orderBy("createdAt", "desc").limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
