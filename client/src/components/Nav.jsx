import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, User, Menu, X, ChevronDown, Sun, Moon } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/hooks/useCatalog";
import { useTheme } from "@/lib/theme-context";
import { Badge } from "@/components/ui/badge";
import Collapse from "@/components/motion/Collapse";
import { gsap, prefersReducedMotion } from "@/lib/motion";

export default function Nav() {
  const { count } = useCart();
  const { data } = useCatalog();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [booksMenuOpen, setBooksMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef(null);
  const cartIconRef = useRef(null);
  const prevCountRef = useRef(count);
  const imprints = data?.imprints ?? [];
  const collections = data?.collections ?? [];

  function openBooksMenu() {
    clearTimeout(closeTimer.current);
    setBooksMenuOpen(true);
  }
  function scheduleCloseBooksMenu() {
    closeTimer.current = setTimeout(() => setBooksMenuOpen(false), 150);
  }

  // Adds a blur/shadow to the header once the page has scrolled past the
  // very top, so it reads as "floating" over content instead of a flat bar
  // that's indistinguishable from the hero underneath it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Punches the cart icon and pops its badge whenever an item is added
  // (count goes up) — a quick, cheap way to confirm "yes, that worked"
  // without a full toast being the only feedback.
  useEffect(() => {
    if (count > prevCountRef.current && cartIconRef.current && !prefersReducedMotion()) {
      gsap.fromTo(
        cartIconRef.current,
        { scale: 1 },
        { scale: 1.3, duration: 0.15, ease: "power2.out", yoyo: true, repeat: 1 }
      );
    }
    prevCountRef.current = count;
  }, [count]);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-300 ${
        scrolled ? "border-line bg-parchment/85 backdrop-blur-sm shadow-sm" : "border-transparent bg-parchment"
      }`}
    >
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
            <ShoppingCart ref={cartIconRef} className="h-5 w-5" />
            {count > 0 && (
              <Badge className="absolute -top-2 -right-2 h-4 min-w-4 px-1 justify-center text-[10px] animate-fade-up">
                {count}
              </Badge>
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

      <Collapse open={booksMenuOpen} className="absolute inset-x-0 top-full z-50 border-t border-line bg-parchment shadow-xl">
        <div
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
      </Collapse>

      <Collapse open={mobileOpen} className="md:hidden border-t border-line bg-parchment">
        <nav className="px-6 py-4 flex flex-col gap-3 font-mono text-xs uppercase tracking-wider">
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
      </Collapse>
    </header>
  );
}
