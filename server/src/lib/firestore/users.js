import { adminAuth, adminDb } from "#lib/firebase/admin";
import { DB_PROVIDER } from "#lib/db-provider";
import * as mysqlUsers from "#lib/mysql/users";
export async function listUsers() {
    if (DB_PROVIDER === "mysql")
        return mysqlUsers.listUsers();
    const snap = await adminDb.collection("users").orderBy("createdAt", "desc").get();
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}
export async function getUser(uid) {
    if (DB_PROVIDER === "mysql")
        return mysqlUsers.getUser(uid);
    const doc = await adminDb.collection("users").doc(uid).get();
    return doc.exists ? ({ uid: doc.id, ...doc.data() }) : null;
}
export async function createUserProfile(uid, email, role, name, contactInfo) {
    if (DB_PROVIDER === "mysql")
        return mysqlUsers.createUserProfile(uid, email, role, name, contactInfo);
    const existing = await adminDb.collection("users").doc(uid).get();
    if (existing.exists)
        return;
    await adminDb.collection("users").doc(uid).set({
        email,
        name: name ?? "",
        phone: contactInfo?.phone ?? "",
        province: contactInfo?.province ?? "",
        city: contactInfo?.city ?? "",
        addressDetail: contactInfo?.addressDetail ?? "",
        role,
        disabled: false,
        createdAt: new Date().toISOString(),
    });
}
export async function inviteUser(email, password, role) {
    if (DB_PROVIDER === "mysql")
        return mysqlUsers.inviteUser(email, password, role);
    const authUser = await adminAuth.createUser({ email, password });
    await adminDb.collection("users").doc(authUser.uid).set({
        email,
        role,
        disabled: false,
        createdAt: new Date().toISOString(),
    });
    return authUser.uid;
}
export async function setUserRole(uid, role) {
    if (DB_PROVIDER === "mysql")
        return mysqlUsers.setUserRole(uid, role);
    await adminDb.collection("users").doc(uid).update({ role });
}
export async function setUserName(uid, name) {
    if (DB_PROVIDER === "mysql")
        return mysqlUsers.setUserName(uid, name);
    await adminDb.collection("users").doc(uid).update({ name });
}
export async function setUserContactInfo(uid, info) {
    if (DB_PROVIDER === "mysql")
        return mysqlUsers.setUserContactInfo(uid, info);
    await adminDb.collection("users").doc(uid).update({
        phone: info.phone ?? "",
        province: info.province ?? "",
        city: info.city ?? "",
        addressDetail: info.addressDetail ?? "",
    });
}
/** Password is stored purely in Firebase Auth, not in either DB provider's `users` table. */
export async function setUserPassword(uid, password) {
    await adminAuth.updateUser(uid, { password });
}
export async function setUserEmail(uid, email) {
    if (DB_PROVIDER === "mysql")
        return mysqlUsers.setUserEmail(uid, email);
    await adminAuth.updateUser(uid, { email });
    await adminDb.collection("users").doc(uid).update({ email });
}
export async function setUserDisabled(uid, disabled) {
    if (DB_PROVIDER === "mysql")
        return mysqlUsers.setUserDisabled(uid, disabled);
    await adminDb.collection("users").doc(uid).update({ disabled });
    await adminAuth.updateUser(uid, { disabled });
}
export async function deleteUser(uid) {
    if (DB_PROVIDER === "mysql")
        return mysqlUsers.deleteUser(uid);
    await adminDb.collection("users").doc(uid).delete();
    await adminAuth.deleteUser(uid).catch(() => { });
}
