import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "@/lib/cart-context";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

const POLL_INTERVAL_MS = 1500;
const MAX_ATTEMPTS = 20; // ~30 seconds

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tranId = searchParams.get("tran_id");
  const { clear } = useCart();
  const [timedOut, setTimedOut] = useState(!tranId);
  const clearedRef = useRef(false);

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
          navigate(`/account/orders/${body.orderId}`);
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

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-10 pb-10">
          {timedOut ? (
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
