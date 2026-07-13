import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "@/lib/cart-context";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { gsap, prefersReducedMotion } from "@/lib/motion";

const POLL_INTERVAL_MS = 1500;
const MAX_ATTEMPTS = 20; // ~30 seconds
const CONFETTI = Array.from({ length: 14 }, (_, i) => i);
const CONFETTI_COLORS = ["var(--color-rust)", "#8C7A5B", "#3F6C51", "#B5502E"];

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tranId = searchParams.get("tran_id");
  const { clear } = useCart();
  const [timedOut, setTimedOut] = useState(!tranId);
  const [orderId, setOrderId] = useState(null);
  const clearedRef = useRef(false);
  const checkRef = useRef(null);
  const confettiRefs = useRef([]);

  useEffect(() => {
    if (!tranId) return;

    let attempts = 0;
    let cancelled = false;

    async function poll() {
      attempts += 1;
      try {
        const body = await apiFetch(`/api/checkout/session/${tranId}`);
        if (cancelled) return;

        if (body.orderId) {
          if (!clearedRef.current) {
            clearedRef.current = true;
            clear();
          }
          setOrderId(body.orderId);
          // A brief pause on this screen so the confirmation actually
          // registers as a moment, instead of an instant redirect that
          // never gives the checkmark/confetti anything to play out.
          setTimeout(() => navigate(`/account/orders/${body.orderId}`), 2200);
          return;
        }
      } catch {
        // keep polling
      }

      if (attempts >= MAX_ATTEMPTS) {
        setTimedOut(true);
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tranId]);

  // Checkmark traces itself in (same stroke-dashoffset technique as
  // CoverArt's motifs), then a small confetti burst fires from its center.
  useEffect(() => {
    if (!orderId || prefersReducedMotion()) return;
    const check = checkRef.current;
    if (check) {
      const length = check.getTotalLength();
      check.style.strokeDasharray = length;
      check.style.strokeDashoffset = length;
      gsap.to(check, { strokeDashoffset: 0, duration: 0.5, delay: 0.15, ease: "power2.out" });
    }
    gsap.fromTo(
      confettiRefs.current,
      { opacity: 1, x: 0, y: 0, scale: 1 },
      {
        opacity: 0,
        x: () => gsap.utils.random(-70, 70),
        y: () => gsap.utils.random(-60, 10),
        scale: 0,
        duration: 0.9,
        delay: 0.4,
        ease: "power2.out",
        stagger: 0.02,
      }
    );
  }, [orderId]);

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-10 pb-10">
          {orderId ? (
            <>
              <div className="relative mx-auto mb-4 h-16 w-16">
                {CONFETTI.map((i) => (
                  <div
                    key={i}
                    ref={(el) => { confettiRefs.current[i] = el; }}
                    aria-hidden="true"
                    className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full opacity-0"
                    style={{ backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }}
                  />
                ))}
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rust/10 text-rust">
                  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
                    <path
                      ref={checkRef}
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="font-display font-bold text-xl text-ink mb-2">Order confirmed</h1>
              <p className="text-sm text-muted-foreground">
                Taking you to{" "}
                <Link to={`/account/orders/${orderId}`} className="text-rust underline">
                  your order
                </Link>
                …
              </p>
            </>
          ) : timedOut ? (
            <>
              <h1 className="font-display font-bold text-xl text-ink mb-2">Payment received</h1>
              <p className="text-sm text-muted-foreground">
                We&apos;re still finalizing your order — it&apos;ll appear in{" "}
                <Link to="/account/orders" className="text-rust underline">
                  your order history
                </Link>{" "}
                shortly, and you&apos;ll get a confirmation email.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display font-bold text-xl text-ink mb-2">Confirming your payment...</h1>
              <p className="text-sm text-muted-foreground">This only takes a moment.</p>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
