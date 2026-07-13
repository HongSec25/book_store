import { Link } from "react-router-dom";
import Reveal from "@/components/motion/Reveal";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-parchment-card mt-16">
      <Reveal
        as="div"
        variant="slide-up"
        stagger
        amount={0.08}
        duration={0.6}
        className="mx-auto max-w-6xl px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8"
      >
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-line mb-3">Browse By</p>
          <ul className="space-y-2 font-body text-sm">
            <li><Link to="/books" className="hover:text-rust">Books</Link></li>
            <li><Link to="/imprints" className="hover:text-rust">Imprints</Link></li>
            <li><Link to="/authors" className="hover:text-rust">Authors</Link></li>
            <li><Link to="/collections" className="hover:text-rust">Collections</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-line mb-3">Company</p>
          <ul className="space-y-2 font-body text-sm">
            <li><Link to="/about" className="hover:text-rust">About</Link></li>
            <li><Link to="/events" className="hover:text-rust">Events</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-line mb-3">Account</p>
          <ul className="space-y-2 font-body text-sm">
            <li><Link to="/account" className="hover:text-rust">Orders</Link></li>
            <li><Link to="/cart" className="hover:text-rust">Cart</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-line mb-3">Follow</p>
          <ul className="space-y-2 font-body text-sm">
            <li><a href="#" className="hover:text-rust">Instagram</a></li>
            <li><a href="#" className="hover:text-rust">Newsletter</a></li>
          </ul>
        </div>
      </Reveal>
      <div className="border-t border-line px-6 py-4 text-center font-mono text-[11px] text-line">
        © {new Date().getFullYear()} Scorched Quarto Press
      </div>
    </footer>
  );
}
