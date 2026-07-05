import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import RealtimeAdmin from "@/components/RealtimeAdmin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const LOW_STOCK_THRESHOLD = 5;

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "inventory"],
    queryFn: () => apiFetch("/api/admin/inventory"),
  });
  const [quantities, setQuantities] = useState({});

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const rows = data.books
    .flatMap((book) => book.formats.map((format) => ({ book, format })))
    .sort((a, b) => a.format.stockCount - b.format.stockCount);

  const outOfStockCount = rows.filter((r) => r.format.stockCount === 0).length;
  const lowStockCount = rows.filter((r) => r.format.stockCount > 0 && r.format.stockCount <= LOW_STOCK_THRESHOLD).length;
  const totalUnits = rows.reduce((sum, r) => sum + r.format.stockCount, 0);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
  }

  async function handleAdd(bookId, formatType) {
    const key = `${bookId}-${formatType}`;
    const quantity = Number(quantities[key]);
    if (!Number.isFinite(quantity) || quantity <= 0) return;
    try {
      await apiFetch("/api/admin/inventory/restock", {
        method: "POST",
        body: JSON.stringify({ bookId, formatType, quantity }),
      });
      toast.success(`Added ${quantity} to stock`);
      setQuantities((prev) => ({ ...prev, [key]: "" }));
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add stock.");
    }
  }

  async function handleReset(bookId, formatType, title) {
    if (!confirm(`Reset "${title}" (${formatType}) stock to 0?`)) return;
    try {
      await apiFetch("/api/admin/inventory/reset", { method: "POST", body: JSON.stringify({ bookId, formatType }) });
      toast.success(`Reset "${title}" (${formatType}) stock to 0`);
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset stock.");
    }
  }

  return (
    <div className="space-y-8">
      <RealtimeAdmin />
      <h1 className="font-display font-bold text-2xl text-ink">Inventory</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total units in stock" value={totalUnits} />
        <StatCard label="Low stock (≤ 5)" value={lowStockCount} highlight={lowStockCount > 0} />
        <StatCard label="Out of stock" value={outOfStockCount} highlight={outOfStockCount > 0} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Add stock</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ book, format }) => {
                const key = `${book.id}-${format.type}`;
                return (
                  <TableRow key={key}>
                    <TableCell className="font-display font-bold text-ink">{book.title}</TableCell>
                    <TableCell className="capitalize text-sm text-ink">{format.type}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{format.sku}</TableCell>
                    <TableCell>
                      {format.stockCount === 0 ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Out of stock
                        </Badge>
                      ) : format.stockCount <= LOW_STOCK_THRESHOLD ? (
                        <Badge variant="outline" className="text-[10px] border-rust text-rust">
                          Low stock
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          In stock
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-ink">{format.stockCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          className="w-20 h-8"
                          value={quantities[key] ?? ""}
                          onChange={(e) => setQuantities((prev) => ({ ...prev, [key]: e.target.value }))}
                        />
                        <Button size="sm" variant="outline" onClick={() => handleAdd(book.id, format.type)}>
                          Add
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {format.stockCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleReset(book.id, format.type, book.title)}
                        >
                          Reset to 0
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                    No formats to track yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <Card className={highlight ? "border-rust" : undefined}>
      <CardContent className="pt-6">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`font-display font-black text-3xl ${highlight ? "text-rust" : "text-ink"}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
