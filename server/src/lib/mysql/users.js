import { getPool } from "#lib/mysql/db";
import { adminAuth } from "#lib/firebase/admin";
function rowToUser(row) {
    return {
        uid: row.uid,
        email: row.email,
        name: row.name ?? undefined,
        phone: row.phone ?? undefined,
        province: row.province ?? undefined,
        city: row.city ?? undefined,
        addressDetail: row.addressDetail ?? undefined,
        role: row.role,
        disabled: Boolean(row.disabled),
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    };
}
export async function listUsers() {
    const [rows] = await getPool().query("SELECT * FROM users ORDER BY createdAt DESC");
    return rows.map(rowToUser);
}
export async function getUser(uid) {
    const [rows] = await getPool().query("SELECT * FROM users WHERE uid = ?", [uid]);
    return rows.length ? rowToUser(rows[0]) : null;
}
export async function inviteUser(email, password, role) {
    const authUser = await adminAuth.createUser({ email, password });
    await getPool().query("INSERT INTO users (uid, email, role, disabled, createdAt) VALUES (?, ?, ?, ?, ?)", [authUser.uid, email, role, false, new Date()]);
    return authUser.uid;
}
export async function createUserProfile(uid, email, role, name, contactInfo) {
    await getPool().query(`INSERT IGNORE INTO users (uid, email, name, phone, province, city, addressDetail, role, disabled, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?)`, [
        uid,
        email,
        name || null,
        contactInfo?.phone || null,
        contactInfo?.province || null,
        contactInfo?.city || null,
        contactInfo?.addressDetail || null,
        role,
        new Date(),
    ]);
}
export async function setUserRole(uid, role) {
    await getPool().query("UPDATE users SET role = ? WHERE uid = ?", [role, uid]);
}
export async function setUserName(uid, name) {
    await getPool().query("UPDATE users SET name = ? WHERE uid = ?", [name || null, uid]);
}
export async function setUserContactInfo(uid, info) {
    await getPool().query("UPDATE users SET phone = ?, province = ?, city = ?, addressDetail = ? WHERE uid = ?", [info.phone || null, info.province || null, info.city || null, info.addressDetail || null, uid]);
}
export async function setUserEmail(uid, email) {
    await adminAuth.updateUser(uid, { email });
    await getPool().query("UPDATE users SET email = ? WHERE uid = ?", [email, uid]);
}
export async function setUserDisabled(uid, disabled) {
    await getPool().query("UPDATE users SET disabled = ? WHERE uid = ?", [disabled, uid]);
    await adminAuth.updateUser(uid, { disabled });
}
export async function deleteUser(uid) {
    await getPool().query("DELETE FROM users WHERE uid = ?", [uid]);
    await adminAuth.deleteUser(uid).catch(() => { });
}
