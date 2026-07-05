import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Wallet, BookOpen, PackageX, Clock3, Plus, Pencil, Trash2, Activity, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import RealtimeAdmin from "@/components/RealtimeAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUSD } from "@/lib/currency";

const ACTION_ICONS = {
  create: { icon: Plus, className: "bg-primary/10 text-primary" },
  update: { icon: Pencil, className: "bg-rust/10 text-rust" },
  delete: { icon: Trash2, className: "bg-destructive/10 text-destructive" },
};

function actionVisual(action) {
  const verb = action.split(".")[1] ?? action;
  return ACTION_ICONS[verb] ?? { icon: Activity, className: "bg-muted text-muted-foreground" };
}

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      const [booksRes, ordersRes, logsRes, revenueRes, usersRes] = await Promise.all([
        apiFetch("/api/admin/books"),
        apiFetch("/api/admin/orders"),
        apiFetch("/api/admin/audit-log"),
        user.role === "admin" ? apiFetch("/api/admin/analytics") : Promise.resolve(null),
        user.role === "admin" ? apiFetch("/api/admin/users") : Promise.resolve(null),
      ]);
      return { books: booksRes.books, orders: ordersRes.orders, logs: logsRes.logs.slice(0, 5), revenue: revenueRes?.summary, users: usersRes?.users };
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const { books, orders, logs, revenue } = data;
  const outOfStockCount = books.filter((b) => b.formats.some((f) => f.stockCount === 0)).length;
  const openOrdersCount = orders.filter((o) => o.status === "placed" || o.status === "processing").length;

  return (
    <div className="space-y-8">
      <RealtimeAdmin announceOrders />
      <div className="animate-fade-up">
        <h1 className="font-display font-bold text-2xl text-ink">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's what's happening in the shop today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {revenue && (
          <StatCard index={0} icon={Wallet} label="Revenue" value={formatUSD(revenue.totalRevenue)} to="/admin/analytics" />
        )}
        <StatCard index={1} icon={BookOpen} label="Books" value={books.length} to="/admin/books" />
        <StatCard index={2} icon={PackageX} label="Out of stock" value={outOfStockCount} to="/admin/inventory" />
        <StatCard index={3} icon={Clock3} label="Open orders" value={openOrdersCount} to="/admin/orders" />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
        <h2 className="font-display font-bold text-lg text-ink mb-3">Recent activity</h2>
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {logs.length === 0 && <p className="p-4 text-sm text-muted-foreground">No activity yet.</p>}
            {logs.map((log) => {
              const { icon: Icon, className } = actionVisual(log.action);
              return (
                <div key={log.id} className="flex items-center gap-3 p-4 text-sm transition-colors hover:bg-muted/40">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${className}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-ink flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="font-mono text-[10px] uppercase shrink-0">
                      {log.action}
                    </Badge>
                    <span className="truncate">{log.entityLabel}</span>
                  </span>
                  <span className="text-muted-foreground text-xs shrink-0">
                    {log.actorEmail} &middot; {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Link
          to="/admin/audit-log"
          className="group mt-3 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-rust"
        >
          View full audit log
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}

function StatCard({ index, icon: Icon, label, value, to }) {
  return (
    <Link to={to} className="block animate-fade-up" style={{ animationDelay: `${index * 80}ms` }}>
      <Card className="transition-all duration-200 hover:-translate-y-1 hover:border-rust hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-normal">
            {label}
          </CardTitle>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rust/10 text-rust">
            <Icon className="h-4 w-4" />
          </span>
        </CardHeader>
        <CardContent>
          <p className="font-display font-black text-3xl text-ink">{value}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
