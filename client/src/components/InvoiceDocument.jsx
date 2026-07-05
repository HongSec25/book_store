import { formatDual } from "@/lib/currency";

/** The PayWay transaction ID doubles as the invoice number when present —
 * it's the real reference PayWay and the customer's bank statement use, so
 * it's more useful for support/reconciliation than our internal order id. */
function invoiceNumber(order) {
  return order.paymentTranId ?? order.id.slice(0, 8).toUpperCase();
}

export default function InvoiceDocument({ order }) {
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="bg-card border border-border rounded-md p-8 print:border-0 print:p-0 print:shadow-none">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-display font-black text-xl text-ink">Scorched Quarto Press</p>
          <p className="text-sm text-muted-foreground">Independent horror & speculative fiction</p>
        </div>
        <div className="text-right">
          <p className="font-display font-bold text-lg text-ink">INVOICE</p>
          <p className="font-mono text-xs text-muted-foreground">#{invoiceNumber(order)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1">Billed to</p>
          <p className="text-sm text-ink">{order.shippingName}</p>
          <p className="text-sm text-ink">{order.customerEmail}</p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-1">Ship to</p>
          <p className="text-sm text-ink whitespace-pre-line">{order.shippingAddress}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Date issued: </span>
          <span className="text-ink">{new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Status: </span>
          <span className="text-ink capitalize">{order.status}</span>
        </div>
        {order.paymentTranId && (
          <div className="col-span-2">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              PayWay transaction ID:{" "}
            </span>
            <span className="text-ink font-mono text-xs">{order.paymentTranId}</span>
          </div>
        )}
      </div>

      <table className="w-full text-sm mb-6">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground font-normal">
              Item
            </th>
            <th className="py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground font-normal text-right">
              Qty
            </th>
            <th className="py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground font-normal text-right">
              Price
            </th>
            <th className="py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground font-normal text-right">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={`${item.bookId}-${item.formatType}`} className="border-b border-border">
              <td className="py-2 text-ink">
                {item.title} <span className="text-muted-foreground capitalize">({item.formatType})</span>
              </td>
              <td className="py-2 text-right text-ink">{item.quantity}</td>
              <td className="py-2 text-right text-ink whitespace-nowrap">{formatDual(item.price)}</td>
              <td className="py-2 text-right text-ink whitespace-nowrap">{formatDual(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-ink">{formatDual(subtotal)}</span>
          </div>
          <div className="flex justify-between gap-4 font-bold text-base pt-1 border-t border-border">
            <span>Total</span>
            <span>{formatDual(order.total)}</span>
          </div>
        </div>
      </div>

      <p className="mt-10 text-xs text-muted-foreground text-center">
        Thank you for your order — Scorched Quarto Press
      </p>
    </div>
  );
}
