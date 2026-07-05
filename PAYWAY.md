# ABA PayWay setup

This project uses ABA PayWay's hosted "Purchase" checkout for payment (replaces an
earlier Stripe integration). Charges are in USD; prices are also shown in KHR
for reference (see `lib/currency.ts`) but PayWay is charged in USD.

## 1. Get sandbox credentials

1. Go to https://www.payway.com.kh/ and register for a merchant account, or if
   you already have one, log into the sandbox dashboard at
   https://merchant-sandbox.payway.com.kh/.
2. Register for a **sandbox** account — no real bank account needed to test.
3. From the merchant dashboard, copy:
   - **Merchant ID** (`merchant_id`)
   - **API Key / Secret Key** (`api_key`)

## 2. Add credentials to `server/.env`

```
PAYWAY_MERCHANT_ID=<merchant id>
PAYWAY_API_KEY=<api key>
ABA_PAYWAY_BASE_URL=https://checkout-sandbox.payway.com.kh
```

Note: `client/index.html` always loads `checkout2-0.js` from
`checkout.payway.com.kh` (production) regardless of this setting — the
sandbox domain 404s on that path, it doesn't host the script at all. The SDK
still submits to whichever `form_url` our server hands it at call time (built
from `ABA_PAYWAY_BASE_URL`), so this is fine: loading the script from prod
does not mean transactions go to prod.

Restart the server after editing — Node only reads env vars at boot.

## 3. Expose your local server for PayWay's callback

PayWay confirms payment via a server-to-server POST to `/api/webhooks/payway`
(the `return_url`), not a browser redirect. It can't reach `localhost`
directly, so for local testing use a tunnel:

```bash
npx ngrok http 3000
```

Browse the app *through* the ngrok URL (not `localhost:3000`) while testing,
since the checkout route derives `return_url`/`continue_success_url` from the
request's own origin.

## 4. Test the flow

1. Add items to cart → checkout → fill shipping → pick KHQR or Card → submit.
2. PayWay's official `checkout2-0.js` SDK (loaded client-side) opens its own
   popup — a KHQR code, or a card-entry form — using the signed fields our
   server built. We don't render or redirect to PayWay's page ourselves.
3. Complete payment with sandbox test options (test card / simulated ABA
   Mobile / KHQR — check PayWay's current sandbox docs for test values).
4. PayWay POSTs to `/api/webhooks/payway`, which marks the order paid, fires
   the real-time admin event, and sends the confirmation email. The checkout
   page polls `/api/checkout/session/[tranId]` until it sees that, then
   redirects to the order detail page.

## 5. Going to production

Get **production** credentials from the (non-sandbox) merchant dashboard,
then set:

```
ABA_PAYWAY_BASE_URL=https://checkout.payway.com.kh
PAYWAY_MERCHANT_ID=<production merchant id>
PAYWAY_API_KEY=<production api key>
```

No tunnel needed in production — your deployed URL is already public.

## Relevant files

- `lib/payway.ts` — builds signed purchase-request fields, verifies callback hash
- `app/api/checkout/session/route.ts` — reserves stock, creates a `pending` order, returns signed form fields
- `app/checkout/CheckoutForm.tsx` — auto-submits the hidden form to PayWay
- `app/api/webhooks/payway/route.ts` — handles PayWay's payment confirmation callback
- `app/checkout/success/page.tsx` — polls order status by `tran_id` until paid
