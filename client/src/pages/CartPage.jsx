import { Link } from "react-router-dom";
import { ShoppingBag, Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useCovers } from "@/hooks/useCovers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CoverArt from "@/components/CoverArt";
import EmptyState from "@/components/EmptyState";
import FadeImage from "@/components/FadeImage";
import { formatDual } from "@/lib/currency";

export default function CartPage() {
  useDocumentTitle("Cart");
  const { items, removeItem, setQuantity, total } = useCart();
  const { data: coverMap = {} } = useCovers();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display font-black text-4xl text-ink text-center mb-10">Your Cart</h1>

      {items.length === 0 ? (
        <Card className="animate-fade-up">
          <CardContent className="py-4">
            <EmptyState
              icon={ShoppingBag}
              title="Your cart is empty"
              description="Add some books to get started."
              actionTo="/books"
              actionLabel="Browse books"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-8 items-start">
          <Card className="animate-fade-up">
            <CardContent className="divide-y divide-border">
              {items.map((item, i) => {
                const coverUrl = coverMap[item.slug];
                return (
                  <div
                    key={`${item.bookId}-${item.formatType}`}
                    className="animate-fade-up py-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors hover:bg-muted/30 rounded-md -mx-2 px-2"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <Link to={`/books/${item.slug}`} className="shrink-0">
                        <div className="h-20 w-14 overflow-hidden rounded-sm border border-border bg-muted shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md">
                          {coverUrl ? (
                            <FadeImage src={coverUrl} alt={`Cover of ${item.title}`} className="h-full w-full object-cover" />
                          ) : (
                            <CoverArt
                              book={{
                                id: item.bookId,
                                title: item.title,
                                coverColor: item.coverColor ?? "#8C7A5B",
                                genreIds: item.genreIds ?? [],
                              }}
                            />
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/books/${item.slug}`} className="font-display font-bold text-ink hover:text-rust">
                          {item.title}
                        </Link>
                        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mt-0.5">
                          {item.formatType} &middot; {formatDual(item.price)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:ml-auto">
                      <div className="flex items-center gap-1 rounded-full border border-border p-0.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          onClick={() => setQuantity(item.bookId, item.formatType, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          onClick={() => setQuantity(item.bookId, item.formatType, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="w-24 text-right font-mono text-xs text-ink shrink-0">
                        {formatDual(item.price * item.quantity)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeItem(item.bookId, item.formatType)}
                        aria-label={`Remove ${item.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="animate-fade-up lg:sticky lg:top-6" style={{ animationDelay: "120ms" }}>
            <CardContent className="space-y-4">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Order summary</p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink">Subtotal</p>
                <p className="font-mono text-sm text-ink">{formatDual(total)}</p>
              </div>
              <p className="text-xs text-muted-foreground">Shipping and taxes calculated at checkout.</p>
              <Link to="/checkout" className={buttonVariants({ size: "lg", className: "w-full" })}>
                Proceed to checkout
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
