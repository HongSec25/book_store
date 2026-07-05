import { adminDb } from "#lib/firebase/admin";
import { DB_PROVIDER } from "#lib/db-provider";
import * as mysqlOrders from "#lib/mysql/orders";
export { ORDER_STATUSES } from "#lib/types";
export async function createOrder(input) {
    if (DB_PROVIDER === "mysql")
        return mysqlOrders.createOrder(input);
    const ref = await adminDb.collection("orders").add({
        ...input,
        channel: input.channel ?? "online",
        status: "placed",
        createdAt: new Date().toISOString(),
    });
    return ref.id;
}
export async function listOrdersForCustomer(uid) {
    if (DB_PROVIDER === "mysql")
        return mysqlOrders.listOrdersForCustomer(uid);
    const snap = await adminDb.collection("orders").where("customerUid", "==", uid).get();
    const orders = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        // Hide in-flight PayWay checkouts the customer never actually paid for.
        .filter((o) => o.paymentStatus !== "pending");
    return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function getOrder(id) {
    if (DB_PROVIDER === "mysql")
        return mysqlOrders.getOrder(id);
    const doc = await adminDb.collection("orders").doc(id).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() }) : null;
}
export async function getOrderByPaymentTranId(tranId) {
    if (DB_PROVIDER === "mysql")
        return mysqlOrders.getOrderByPaymentTranId(tranId);
    const snap = await adminDb.collection("orders").where("paymentTranId", "==", tranId).limit(1).get();
    if (snap.empty)
        return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
}
export async function setOrderPaymentStatus(id, paymentStatus) {
    if (DB_PROVIDER === "mysql")
        return mysqlOrders.setOrderPaymentStatus(id, paymentStatus);
    await adminDb.collection("orders").doc(id).update({ paymentStatus });
}
export async function setOrderPaymentQr(id, qrImage, deeplink) {
    if (DB_PROVIDER === "mysql")
        return mysqlOrders.setOrderPaymentQr(id, qrImage, deeplink);
    await adminDb.collection("orders").doc(id).update({ paymentQrImage: qrImage, paymentDeeplink: deeplink });
}
export async function getPendingOrderForCustomer(uid) {
    if (DB_PROVIDER === "mysql")
        return mysqlOrders.getPendingOrderForCustomer(uid);
    const snap = await adminDb
        .collection("orders")
        .where("customerUid", "==", uid)
        .where("paymentStatus", "==", "pending")
        .get();
    if (snap.empty)
        return null;
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return orders[0];
}
export async function listOrders() {
    if (DB_PROVIDER === "mysql")
        return mysqlOrders.listOrders();
    const snap = await adminDb.collection("orders").get();
    const orders = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((o) => o.paymentStatus !== "pending");
    return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function setOrderStatus(id, status) {
    if (DB_PROVIDER === "mysql")
        return mysqlOrders.setOrderStatus(id, status);
    await adminDb.collection("orders").doc(id).update({ status });
}
export async function deleteOrder(id) {
    if (DB_PROVIDER === "mysql")
        return mysqlOrders.deleteOrder(id);
    await adminDb.collection("orders").doc(id).delete();
}
/** "Customers who bought this also bought" — ranks other book ids by how
 * often they co-occur with `bookId` across every real (non-pending) order,
 * built on top of listOrders() rather than a bespoke query so it works
 * identically for both DB providers. Fine to scan every order in memory at
 * this catalog's scale; revisit if the order volume ever gets large. */
export async function getFrequentlyBoughtWith(bookId, limit = 4) {
    const orders = await listOrders();
    const counts = new Map();
    for (const order of orders) {
        const ids = order.items.map((i) => i.bookId);
        if (!ids.includes(bookId))
            continue;
        for (const id of ids) {
            if (id === bookId)
                continue;
            counts.set(id, (counts.get(id) ?? 0) + 1);
        }
    }
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);
}
