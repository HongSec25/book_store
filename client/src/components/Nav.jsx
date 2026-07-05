import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, User, Menu, X, ChevronDown, Sun, Moon } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/hooks/useCatalog";
import { useTheme } from "@/lib/theme-context";
import { Badge } from "@/components/ui/badge";

export default function Nav() {
  const { count } = useCart();
  const { data } = useCatalog();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [booksMenuOpen, setBooksMenuOpen] = useState(false);
  const closeTimer = useRef(null);
  const imprints = data?.imprints ?? [];
  const collections = data?.collections ?? [];

  function openBooksMenu() {
    clearTimeout(closeTimer.current);
    setBooksMenuOpen(true);
  }
  function scheduleCloseBooksMenu() {
    closeTimer.current = setTimeout(() => setBooksMenuOpen(false), 150);
  }

  return (
    <header className="relative border-b border-line bg-parchment">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="font-display font-black text-xl tracking-tight text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-rust rounded-sm"
        >
          Scorched Quarto
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-wider">
          <div onMouseEnter={openBooksMenu} onMouseLeave={scheduleCloseBooksMenu}>
            <button
              type="button"
              className="flex items-center gap-1 text-ink hover:text-rust focus:outline-none focus-visible:ring-2 focus-visible:ring-rust rounded-sm"
              aria-haspopup="menu"
              aria-expanded={booksMenuOpen}
              onClick={() => setBooksMenuOpen((v) => !v)}
            >
              Books <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          <Link to="/imprints" className="text-ink hover:text-rust focus:outline-none focus-visible:ring-2 focus-visible:ring-rust rounded-sm">
            Imprints
          </Link>
          <Link to="/about" className="text-ink hover:text-rust focus:outline-none focus-visible:ring-2 focus-visible:ring-rust rounded-sm">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="text-ink hover:text-rust focus:outline-none focus-visible:ring-2 focus-visible:ring-rust rounded-sm"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Link
            to="/account"
            aria-label="Account"
            className="text-ink hover:text-rust focus:outline-none focus-visible:ring-2 focus-visible:ring-rust rounded-sm"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            to="/cart"
            aria-label="Cart"
            className="relative text-ink hover:text-rust focus:outline-none focus-visible:ring-2 focus-visible:ring-rust rounded-sm"
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <Badge className="absolute -top-2 -right-2 h-4 min-w-4 px-1 justify-center text-[10px]">{count}</Badge>
            )}
          </Link>
          <button
            type="button"
            className="md:hidden text-ink"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {booksMenuOpen && (
        <div
          className="absolute inset-x-0 top-full z-50 border-t border-line bg-parchment shadow-xl"
          onMouseEnter={openBooksMenu}
          onMouseLeave={scheduleCloseBooksMenu}
        >
          <div className="mx-auto grid max-w-6xl grid-cols-3 gap-10 px-6 py-8 normal-case tracking-normal">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Browse</p>
              <div className="flex flex-col gap-2">
                <Link to="/books" onClick={() => setBooksMenuOpen(false)} className="text-sm text-ink hover:text-rust">
                  All books
                </Link>
                <Link to="/authors" onClick={() => setBooksMenuOpen(false)} className="text-sm text-ink hover:text-rust">
                  Authors
                </Link>
                <Link to="/collections" onClick={() => setBooksMenuOpen(false)} className="text-sm text-ink hover:text-rust">
                  Collections
                </Link>
              </div>
            </div>

            {collections.length > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Shop by collection</p>
                <div className="flex flex-col gap-2">
                  {collections.map((collection) => (
                    <Link
                      key={collection.id}
                      to={`/collections/${collection.slug}`}
                      onClick={() => setBooksMenuOpen(false)}
                      className="text-sm text-ink hover:text-rust"
                    >
                      {collection.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {imprints.length > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Imprints</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {imprints.map((imprint) => (
                    <Link
                      key={imprint.id}
                      to={`/imprints/${imprint.slug}`}
                      onClick={() => setBooksMenuOpen(false)}
                      className="text-sm text-ink hover:text-rust"
                    >
                      {imprint.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {mobileOpen && (
        <nav className="md:hidden border-t border-line bg-parchment px-6 py-4 flex flex-col gap-3 font-mono text-xs uppercase tracking-wider">
          <Link to="/books" onClick={() => setMobileOpen(false)} className="text-ink hover:text-rust">
            Books
          </Link>
          <Link to="/authors" onClick={() => setMobileOpen(false)} className="text-ink hover:text-rust">
            Authors
          </Link>
          <Link to="/collections" onClick={() => setMobileOpen(false)} className="text-ink hover:text-rust">
            Collections
          </Link>
          <Link to="/imprints" onClick={() => setMobileOpen(false)} className="text-ink hover:text-rust">
            Imprints
          </Link>
          <Link to="/about" onClick={() => setMobileOpen(false)} className="text-ink hover:text-rust">
            About
          </Link>
        </nav>
      )}
    </header>
  );
}
