import { randomUUID } from "crypto";
import { getPool } from "#lib/mysql/db";
function rowToOrder(row) {
    return {
        id: row.id,
        customerUid: row.customerUid,
        customerEmail: row.customerEmail,
        items: row.items,
        total: Number(row.total),
        shippingName: row.shippingName,
        shippingAddress: row.shippingAddress,
        status: row.status,
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
        paymentTranId: row.paymentTranId ?? undefined,
        paymentStatus: row.paymentStatus ?? undefined,
        paymentQrImage: row.paymentQrImage ?? undefined,
        paymentDeeplink: row.paymentDeeplink ?? undefined,
        channel: row.channel ?? "online",
    };
}
export async function createOrder(input) {
    const id = randomUUID();
    await getPool().query(`INSERT INTO orders
      (id, customerUid, customerEmail, items, total, shippingName, shippingAddress, status, createdAt, paymentTranId, paymentStatus, channel)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        id,
        input.customerUid,
        input.customerEmail,
        JSON.stringify(input.items),
        input.total,
        input.shippingName,
        input.shippingAddress,
        "placed",
        new Date(),
        input.paymentTranId ?? null,
        input.paymentStatus ?? null,
        input.channel ?? "online",
    ]);
    return id;
}
export async function listOrdersForCustomer(uid) {
    // Orders sitting at paymentStatus "pending" are in-flight PayWay checkouts
    // the customer never actually paid for (abandoned QR scan, closed tab,
    // etc.) — don't show them as real orders until the webhook confirms paid.
    const [rows] = await getPool().query("SELECT * FROM orders WHERE customerUid = ? AND (paymentStatus IS NULL OR paymentStatus <> 'pending') ORDER BY createdAt DESC", [uid]);
    return rows.map(rowToOrder);
}
export async function getOrder(id) {
    const [rows] = await getPool().query("SELECT * FROM orders WHERE id = ?", [id]);
    return rows.length ? rowToOrder(rows[0]) : null;
}
export async function getOrderByPaymentTranId(tranId) {
    const [rows] = await getPool().query("SELECT * FROM orders WHERE paymentTranId = ?", [tranId]);
    return rows.length ? rowToOrder(rows[0]) : null;
}
export async function setOrderPaymentStatus(id, paymentStatus) {
    await getPool().query("UPDATE orders SET paymentStatus = ? WHERE id = ?", [paymentStatus, id]);
}
export async function setOrderPaymentQr(id, qrImage, deeplink) {
    await getPool().query("UPDATE orders SET paymentQrImage = ?, paymentDeeplink = ? WHERE id = ?", [
        qrImage,
        deeplink,
        id,
    ]);
}
/** Most recent still-in-flight PayWay checkout for this customer, if any —
 * used to avoid spinning up a second parallel payment (and reserving stock
 * twice) when a customer retries or opens a second tab mid-checkout. */
export async function getPendingOrderForCustomer(uid) {
    const [rows] = await getPool().query("SELECT * FROM orders WHERE customerUid = ? AND paymentStatus = 'pending' ORDER BY createdAt DESC LIMIT 1", [uid]);
    return rows.length ? rowToOrder(rows[0]) : null;
}
export async function listOrders() {
    // Same reasoning as listOrdersForCustomer — hide unpaid, still-pending
    // PayWay checkout attempts from the admin dashboard.
    const [rows] = await getPool().query("SELECT * FROM orders WHERE paymentStatus IS NULL OR paymentStatus <> 'pending' ORDER BY createdAt DESC");
    return rows.map(rowToOrder);
}
export async function setOrderStatus(id, status) {
    await getPool().query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
}
export async function deleteOrder(id) {
    await getPool().query("DELETE FROM orders WHERE id = ?", [id]);
}
