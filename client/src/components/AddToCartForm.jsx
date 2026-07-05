import { useState } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDual, formatUSD } from "@/lib/currency";

export default function AddToCartForm({ book }) {
  const { addItem } = useCart();
  const [formatType, setFormatType] = useState(book.formats[0]?.type ?? "ebook");
  const [quantity, setQuantity] = useState(1);

  if (book.formats.length === 0) {
    return <p className="text-sm text-muted-foreground">Currently out of print.</p>;
  }

  const selected = book.formats.find((f) => f.type === formatType) ?? book.formats[0];
  const maxQuantity = Math.max(1, selected.stockCount);

  function handleFormatChange(type) {
    setFormatType(type);
    setQuantity(1);
  }

  function handleAdd() {
    addItem(
      {
        bookId: book.id,
        slug: book.slug,
        title: book.title,
        formatType: selected.type,
        price: selected.price,
        coverColor: book.coverColor,
        genreIds: book.genreIds,
      },
      quantity
    );
    toast.success(`Added ${quantity > 1 ? `${quantity}× ` : ""}"${book.title}" to cart`);
    setQuantity(1);
  }

  return (
    <div className="space-y-3">
      <p className="font-display font-black text-2xl text-ink">{formatDual(selected.price)}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Select value={formatType} onValueChange={handleFormatChange}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {book.formats.map((f) => (
              <SelectItem key={f.type} value={f.type} disabled={f.stockCount === 0}>
                <span className="capitalize">{f.type}</span> — {formatUSD(f.price)}
                {f.stockCount === 0 ? " (out of stock)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 rounded-full border border-input p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={selected.stockCount === 0}
            aria-label="Decrease quantity"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-6 text-center text-sm">{quantity}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            disabled={selected.stockCount === 0 || quantity >= maxQuantity}
            aria-label="Increase quantity"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <Button onClick={handleAdd} disabled={selected.stockCount === 0}>
          Add to cart
        </Button>
      </div>
      {selected.stockCount > 0 && selected.stockCount <= 5 && (
        <p className="text-xs text-muted-foreground">Only {selected.stockCount} left in stock.</p>
      )}
    </div>
  );
}
