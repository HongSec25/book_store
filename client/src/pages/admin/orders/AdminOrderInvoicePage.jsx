import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import PrintInvoiceButton from "@/components/PrintInvoiceButton";
import InvoiceDocument from "@/components/InvoiceDocument";

export default function AdminOrderInvoicePage() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", id],
    queryFn: () => apiFetch(`/api/admin/orders/${id}`),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const { order } = data;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link to={`/admin/orders/${order.id}`} className="font-mono text-xs uppercase tracking-wider text-rust">
          &larr; Back to order
        </Link>
        <PrintInvoiceButton />
      </div>

      <InvoiceDocument order={order} />
    </div>
  );
}
