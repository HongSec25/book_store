import { listOrders } from "#lib/firestore/orders";
import { listBooks } from "#lib/firestore/books";
function isRevenueOrder(order) {
    return order.status !== "cancelled";
}
// Pure helpers — operate on already-fetched data so pages that already loaded
// books/orders for other reasons don't have to re-query the same tables.
export function computeRevenueSummary(orders) {
    const revenueOrders = orders.filter(isRevenueOrder);
    const totalRevenue = revenueOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = revenueOrders.length;
    const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
    return { totalRevenue, totalOrders, averageOrderValue };
}
export function computeRevenueByDay(orders, days = 14) {
    const revenueOrders = orders.filter(isRevenueOrder);
    const buckets = new Map();
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        buckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const order of revenueOrders) {
        const day = order.createdAt.slice(0, 10);
        if (buckets.has(day))
            buckets.set(day, (buckets.get(day) ?? 0) + order.total);
    }
    return Array.from(buckets.entries()).map(([date, revenue]) => ({ date, revenue }));
}
export function computeBestSellers(orders, books, limit = 5) {
    const revenueOrders = orders.filter(isRevenueOrder);
    const qtyByBook = new Map();
    const revenueByBook = new Map();
    for (const order of revenueOrders) {
        for (const item of order.items) {
            qtyByBook.set(item.bookId, (qtyByBook.get(item.bookId) ?? 0) + item.quantity);
            revenueByBook.set(item.bookId, (revenueByBook.get(item.bookId) ?? 0) + item.price * item.quantity);
        }
    }
    const bookById = new Map(books.map((b) => [b.id, b]));
    return Array.from(qtyByBook.entries())
        .map(([bookId, quantity]) => ({
        bookId,
        title: bookById.get(bookId)?.title ?? "Unknown book",
        quantity,
        revenue: revenueByBook.get(bookId) ?? 0,
    }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit);
}
export function computeCustomerSpend(orders) {
    const revenueOrders = orders.filter(isRevenueOrder);
    return revenueOrders.reduce((acc, o) => {
        acc[o.customerUid] = (acc[o.customerUid] ?? 0) + o.total;
        return acc;
    }, {});
}
export function computeLowStockFormats(books, threshold = 5, limit = 5) {
    return books
        .flatMap((book) => book.formats.map((format) => ({ book, format })))
        .filter((r) => r.format.stockCount <= threshold)
        .sort((a, b) => a.format.stockCount - b.format.stockCount)
        .slice(0, limit);
}
// Fetching wrappers — for pages that don't already have books/orders loaded.
export async function getRevenueSummary() {
    return computeRevenueSummary(await listOrders());
}
export async function getRevenueByDay(days = 14) {
    return computeRevenueByDay(await listOrders(), days);
}
export async function getBestSellers(limit = 5) {
    const [orders, books] = await Promise.all([listOrders(), listBooks()]);
    return computeBestSellers(orders, books, limit);
}
export async function getCustomerSpend() {
    return computeCustomerSpend(await listOrders());
}
export async function getLowStockFormats(threshold = 5, limit = 5) {
    return computeLowStockFormats(await listBooks(), threshold, limit);
}
