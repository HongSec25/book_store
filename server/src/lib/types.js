export const ORDER_STATUSES = ["placed", "processing", "shipped", "delivered", "cancelled"];
/** Once an order reaches one of these, its status is final and can no longer be changed. */
export const TERMINAL_ORDER_STATUSES = ["delivered", "cancelled"];
export function isTerminalOrderStatus(status) {
    return TERMINAL_ORDER_STATUSES.includes(status);
}
