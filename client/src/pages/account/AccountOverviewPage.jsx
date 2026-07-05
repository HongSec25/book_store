import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Package, Wallet, Clock3, ClipboardList } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Card, CardContent } from "@/components/ui/card";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDual } from "@/lib/currency";

const STATUS_DOT = {
  placed: "bg-muted-foreground",
  processing: "bg-rust",
  shipped: "bg-rust",
  delivered: "bg-ink",
  cancelled: "bg-destructive",
};

export default function AccountOverviewPage() {
  useDocumentTitle("My Account");
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["account", "orders"],
    queryFn: () => apiFetch("/api/account/orders"),
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const orders = data.orders;
  const activeOrders = orders.filter((o) => o.status !== "cancelled");
  const totalSpent = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const openOrders = orders.filter((o) => o.status === "placed" || o.status === "processing").length;
  const initial = (user.name || user.email).charAt(0).toUpperCase();
  const recentOrders = orders.slice(0, 4);

  return (
    <div className="space-y-8">
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="pt-6 flex items-center gap-4">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-rust text-parchment font-display font-black text-2xl shadow-sm">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-wider text-rust mb-1">My account</p>
            <h1 className="font-display font-black text-xl sm:text-3xl text-ink truncate">{user.name || user.email}</h1>
            <p className="text-sm text-muted-foreground mt-1 truncate">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile icon={Package} label="Orders" value={orders.length} />
        <StatTile icon={Wallet} label="Total spent" value={formatDual(totalSpent)} />
        <StatTile icon={Clock3} label="In progress" value={openOrders} />
      </div>

      <div>
        <h2 className="font-display font-bold text-lg text-ink mb-3">Recent activity</h2>
        {recentOrders.length === 0 ? (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="py-4">
              <EmptyState
                icon={ClipboardList}
                title="No orders yet"
                description="Once you place an order, it'll show up here."
                actionTo="/books"
                actionLabel="Start browsing"
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="pt-6">
              <ol className="space-y-5">
                {recentOrders.map((order) => (
                  <li key={order.id} className="relative pl-6">
                    <span className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${STATUS_DOT[order.status]}`} />
                    <Link to={`/account/orders/${order.id}`} className="flex items-center justify-between gap-3 group">
                      <div>
                        <p className="text-sm text-ink group-hover:text-rust">
                          Order #{order.id.slice(0, 8)}{" "}
                          <span className="text-muted-foreground capitalize">— {order.status}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="font-mono text-xs text-ink shrink-0">{formatDual(order.total)}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}
        {orders.length > 4 && (
          <Link to="/account/orders" className="inline-block mt-3 font-mono text-xs uppercase tracking-wider text-rust">
            View all orders &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="pt-6 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-parchment text-rust">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-display font-black text-xl text-ink">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
