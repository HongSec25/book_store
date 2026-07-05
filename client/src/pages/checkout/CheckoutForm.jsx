import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingBag, Banknote } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDual, formatUSD } from "@/lib/currency";
import { apiFetch } from "@/lib/api";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 90; // ~3 minutes
const COD_ELIGIBLE_PROVINCE = "Phnom Penh";

// QR: the server submits the purchase itself and hands back a ready
// qrImage/qrString/abapayDeeplink, rendered directly. Cash on delivery
// (cod): no PayWay involved at all, order is confirmed immediately — no
// rider network to collect cash outside Phnom Penh, so it's only offered
// there (re-validated server-side too, not just hidden here).
export default function CheckoutForm({ email, defaultName, defaultAddress, province }) {
  const navigate = useNavigate();
  const { items, total, clear } = useCart();
  const [shippingName, setShippingName] = useState(defaultName);
  const [shippingAddress, setShippingAddress] = useState(defaultAddress);
  const [method, setMethod] = useState("qr");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [payment, setPayment] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const [qr, setQr] = useState(null);

  const codEligible = province === COD_ELIGIBLE_PROVINCE;

  useEffect(() => {
    if (!codEligible && method === "cod") setMethod("qr");
  }, [codEligible, method]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const body = await apiFetch("/api/checkout/session", {
        method: "POST",
        body: JSON.stringify({ items, shippingName, shippingAddress, shippingProvince: province, method }),
      });

      if (method === "cod") {
        // Confirmed immediately — nothing async to wait for, cash is
        // collected on delivery instead of paid up front.
        clear();
        navigate(`/account/orders/${body.orderId}`);
        return;
      }

      if (!body.qrImage) {
        setError(body.qrError || "Could not generate a QR code — please try again.");
        setPending(false);
        return;
      }
      setQr({ qrImage: body.qrImage, qrString: body.qrString, abapayDeeplink: body.abapayDeeplink });
      setPayment({ orderId: body.orderId, tranId: body.tranId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setPending(false);
    }
  }

  useEffect(() => {
    if (!payment) return;

    let attempts = 0;
    let cancelled = false;

    async function poll() {
      attempts += 1;
      try {
        const body = await apiFetch(`/api/checkout/session/${payment.tranId}`);
        if (cancelled) return;

        if (!body.pending && body.orderId) {
          clear();
          navigate(`/account/orders/${body.orderId}`);
          return;
        }
      } catch {
        // keep polling
      }

      if (attempts >= MAX_POLL_ATTEMPTS) {
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
  }, [payment]);

  if (items.length === 0 && !payment) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        description="Add some books first, then come back to check out."
        actionTo="/books"
        actionLabel="Browse books"
      />
    );
  }

  return (
    <>
      {qr && (
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <img src={qr.qrImage} alt="ABA PayWay KHQR code" className="h-56 w-56" />
            {qr.abapayDeeplink && (
              <a href={qr.abapayDeeplink} className="font-mono text-xs uppercase tracking-wider text-rust underline">
                Open in ABA Mobile
              </a>
            )}
            <p className="text-sm text-muted-foreground">Scan with any KHQR-enabled banking app to pay.</p>
          </CardContent>
        </Card>
      )}

      {payment && (
        <p className="text-center text-sm text-muted-foreground mb-4">
          {timedOut ? (
            <>
              Still waiting on payment confirmation — it&apos;ll appear in{" "}
              <Link to="/account/orders" className="text-rust underline">
                your order history
              </Link>{" "}
              once confirmed.
            </>
          ) : (
            "Waiting for payment confirmation..."
          )}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Shipping details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shippingName">Full name</Label>
              <Input id="shippingName" value={shippingName} onChange={(e) => setShippingName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shippingAddress">Shipping address</Label>
              <Textarea
                id="shippingAddress"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                required
                rows={3}
              />
            </div>

            <Separator />

            <div className="space-y-1.5 text-sm">
              {items.map((item) => (
                <div key={`${item.bookId}-${item.formatType}`} className="flex justify-between text-ink">
                  <span>
                    {item.title} <span className="text-muted-foreground">&times;{item.quantity}</span>
                  </span>
                  <span>{formatDual(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-2">
                <span>Total</span>
                <span>{formatDual(total)}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={method === "qr" ? "default" : "outline"} onClick={() => setMethod("qr")}>
                  KHQR / ABA Mobile
                </Button>
                <Button
                  type="button"
                  variant={method === "cod" ? "default" : "outline"}
                  onClick={() => codEligible && setMethod("cod")}
                  disabled={!codEligible}
                  title={codEligible ? undefined : "Cash on delivery is only available for Phnom Penh addresses"}
                >
                  <Banknote /> Cash on delivery
                </Button>
              </div>
              {!codEligible && (
                <p className="text-xs text-muted-foreground">
                  Cash on delivery is only available for addresses in Phnom Penh.
                </p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={pending}>
              {pending
                ? method === "cod"
                  ? "Placing order..."
                  : "Generating QR..."
                : method === "cod"
                ? `Place order — ${formatUSD(total)}`
                : `Continue to payment — ${formatUSD(total)}`}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {method === "cod"
                ? "Pay in cash when your order arrives."
                : "A KHQR code will appear below to scan or open in ABA Mobile (charged in USD)."}
            </p>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
