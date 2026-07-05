import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import RevenueChart from "@/components/RevenueChart";
import { formatDual } from "@/lib/currency";

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => apiFetch("/api/admin/analytics"),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const { summary, byDay, bestSellers } = data;

  return (
    <div className="space-y-8">
      <h1 className="font-display font-bold text-2xl text-ink">Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total revenue" value={formatDual(summary.totalRevenue)} />
        <StatCard label="Orders" value={String(summary.totalOrders)} />
        <StatCard label="Average order value" value={formatDual(summary.averageOrderValue)} />
      </div>

      <div>
        <h2 className="font-display font-bold text-lg text-ink mb-3">Revenue, last 14 days</h2>
        <Card>
          <CardContent className="pt-6">
            <RevenueChart byDay={byDay} />
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="font-display font-bold text-lg text-ink mb-3">Best sellers</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Units sold</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bestSellers.map((b) => (
                  <TableRow key={b.bookId}>
                    <TableCell className="font-display font-bold text-ink">{b.title}</TableCell>
                    <TableCell className="font-mono text-sm text-ink">{b.quantity}</TableCell>
                    <TableCell className="font-mono text-sm text-ink">{formatDual(b.revenue)}</TableCell>
                  </TableRow>
                ))}
                {bestSellers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">
                      No sales yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-normal">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-display font-black text-3xl text-ink">{value}</p>
      </CardContent>
    </Card>
  );
}
