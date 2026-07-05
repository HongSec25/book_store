import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Plus, Minus, Trash2, Receipt, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useCovers } from "@/hooks/useCovers";
import CoverArt from "@/components/CoverArt";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatUSD } from "@/lib/currency";

export default function PosPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "books"],
    queryFn: () => apiFetch("/api/admin/books"),
  });
  const { data: coverMap = {} } = useCovers();
  const [q, setQ] = useState("");
  const [cart, setCart] = useState([]); // [{ bookId, formatType, title, slug, price, stockCount, quantity }]
  const [cashTendered, setCashTendered] = useState("");
  const [pending, setPending] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const books = useMemo(() => data?.books ?? [], [data]);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const needle = q.toLowerCase();
    return books.filter((b) => b.title.toLowerCase().includes(needle) || b.isbn?.includes(needle)).slice(0, 8);
  }, [books, q]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tendered = Number(cashTendered) || 0;
  const change = Math.max(0, tendered - total);
  const canComplete = cart.length > 0 && tendered >= total;

  function addToCart(book, format) {
    setCart((prev) => {
      const existing = prev.find((i) => i.bookId === book.id && i.formatType === format.type);
      const cartQty = existing?.quantity ?? 0;
      if (cartQty + 1 > format.stockCount) {
        toast.error(`Only ${format.stockCount} in stock.`);
        return prev;
      }
      if (existing) {
        return prev.map((i) => (i === existing ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          bookId: book.id,
          slug: book.slug,
          title: book.title,
          formatType: format.type,
          price: format.price,
          stockCount: format.stockCount,
          quantity: 1,
        },
      ];
    });
  }

  function setQuantity(bookId, formatType, quantity) {
    setCart((prev) =>
      prev
        .map((i) => (i.bookId === bookId && i.formatType === formatType ? { ...i, quantity: Math.min(quantity, i.stockCount) } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  async function handleCompleteSale() {
    setPending(true);
    try {
      const body = await apiFetch("/api/admin/pos/sale", {
        method: "POST",
        body: JSON.stringify({
          items: cart.map((i) => ({ bookId: i.bookId, formatType: i.formatType, quantity: i.quantity })),
          cashTendered: tendered,
        }),
      });
      setReceipt(body);
      setCart([]);
      setCashTendered("");
      queryClient.invalidateQueries({ queryKey: ["admin", "books"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sale failed.");
    } finally {
      setPending(false);
    }
  }

  function startNewSale() {
    setReceipt(null);
  }

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  if (receipt) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rust/10 text-rust mb-4">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="font-display font-bold text-lg text-ink">Sale complete</p>
            <p className="text-sm text-muted-foreground mt-1">Order #{receipt.orderId.slice(0, 8)}</p>

            <div className="w-full mt-6 space-y-1.5 text-left">
              {receipt.items.map((item) => (
                <div key={`${item.bookId}-${item.formatType}`} className="flex justify-between text-sm">
                  <span className="text-ink">
                    {item.title} <span className="text-muted-foreground capitalize">({item.formatType})</span>{" "}
                    <span className="text-muted-foreground">&times;{item.quantity}</span>
                  </span>
                  <span className="font-mono text-ink">{formatUSD(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="w-full space-y-1">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="font-mono">{formatUSD(receipt.total)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Cash tendered</span>
                <span className="font-mono">{formatUSD(receipt.cashTendered)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-rust">
                <span>Change due</span>
                <span className="font-mono">{formatUSD(receipt.change)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Button size="lg" className="w-full" onClick={startNewSale}>
          Start new sale
        </Button>
        <Link to={`/admin/orders/${receipt.orderId}`} className="block text-center font-mono text-xs uppercase tracking-wider text-rust">
          View order details &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink mb-4">Point of sale</h1>
        <div className="relative flex items-center border-b border-line mb-6">
          <Search className="h-4 w-4 text-line shrink-0" aria-hidden="true" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title or ISBN..."
            className="border-none shadow-none bg-transparent font-body text-lg text-ink placeholder:text-line focus-visible:ring-0 px-3 h-auto"
            autoFocus
          />
        </div>

        <div className="space-y-3">
          {results.map((book) => (
            <Card key={book.id}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="h-16 w-11 shrink-0 overflow-hidden rounded-sm border border-border">
                  {coverMap[book.slug] ? (
                    <img src={coverMap[book.slug]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <CoverArt book={book} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-ink truncate">{book.title}</p>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {book.formats.map((f) => (
                      <Button
                        key={f.type}
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={f.stockCount === 0}
                        onClick={() => addToCart(book, f)}
                      >
                        <span className="capitalize">{f.type}</span> — {formatUSD(f.price)}
                        {f.stockCount === 0 ? " (out)" : ""}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {q.trim() && results.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">No books match "{q}".</p>
          )}
          {!q.trim() && (
            <p className="text-sm text-muted-foreground py-6 text-center">Search for a book to start a sale.</p>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Current sale
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No items yet.</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={`${item.bookId}-${item.formatType}`} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink truncate">{item.title}</p>
                      <p className="font-mono text-xs text-muted-foreground capitalize">
                        {item.formatType} &middot; {formatUSD(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border border-input p-0.5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => setQuantity(item.bookId, item.formatType, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-5 text-center text-xs">{item.quantity}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => setQuantity(item.bookId, item.formatType, item.quantity + 1)}
                        disabled={item.quantity >= item.stockCount}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => setQuantity(item.bookId, item.formatType, 0)}
                      aria-label={`Remove ${item.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="font-mono">{formatUSD(total)}</span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cashTendered" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Cash tendered
              </label>
              <Input
                id="cashTendered"
                type="number"
                min="0"
                step="0.01"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Change due</span>
              <span className="font-mono text-ink">{formatUSD(change)}</span>
            </div>

            <Button size="lg" className="w-full" disabled={!canComplete || pending} onClick={handleCompleteSale}>
              {pending ? "Completing sale..." : "Complete sale"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
