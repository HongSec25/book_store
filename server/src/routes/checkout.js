import { randomBytes } from "node:crypto";
import { Router } from "express";
import { requireCustomer } from "../middleware/auth.js";
import { adjustStock, getBook, reserveStock } from "#lib/firestore/books";
import {
  createOrder,
  deleteOrder,
  getPendingOrderForCustomer,
  getOrderByPaymentTranId,
  setOrderPaymentStatus,
  setOrderStatus,
} from "#lib/firestore/orders";
import { buildPurchaseFields, checkTransactionStatus, submitPurchase } from "#lib/payway";
import { emitAdminEvent } from "#lib/events";
import { sendOrderConfirmationEmail } from "#lib/email";

export const checkoutRouter = Router();

// Cash on delivery is only offered for Phnom Penh addresses — anywhere else
// there's no rider network to collect cash on drop-off, so those customers
// only ever see the QR option client-side. Enforced again here since the
// client's restriction is just UI; nothing stops a direct POST otherwise.
const COD_ELIGIBLE_PROVINCE = "Phnom Penh";

// QR: we submit the purchase server-side ourselves (a raw server-to-server
// call to PayWay's Purchase API returns the same qrImage/qrString payload
// regardless of payment_option, confirmed directly) and hand the client the
// ready-to-render result — no widget/iframe needed for a static QR/deeplink.
async function buildResponsePayload(fields, orderId, tranId) {
  const purchase = await submitPurchase(fields);
  if (!purchase.ok) {
    return { orderId, tranId, qrError: purchase.message };
  }
  return {
    orderId,
    tranId,
    qrString: purchase.qrString,
    qrImage: purchase.qrImage,
    abapayDeeplink: purchase.abapayDeeplink,
  };
}

/** PayWay caps tran_id at 20 characters, so a plain UUID (36 chars) won't do —
 * this packs a base36 timestamp with a few random bytes for uniqueness. */
function generateTranId() {
  return `${Date.now().toString(36)}${randomBytes(4).toString("hex")}`;
}

// How long a pending checkout stays "reusable" before we treat it as
// abandoned and let the customer start a fresh one instead.
const PENDING_ORDER_TTL_MS = 15 * 60 * 1000;

// Unlike the old single-app Next version (one origin for everything), the
// API server and the client SPA are different origins now: PayWay's webhook
// must call back to the API, but the browser redirect/cancel targets are
// client-side routes.
function fieldsForOrder(order, firstname, lastname, paymentOption) {
  const apiOrigin = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;
  const clientOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

  return buildPurchaseFields({
    tranId: order.paymentTranId,
    amount: order.total,
    currency: "USD",
    items: order.items.map((i) => ({ name: `${i.title} (${i.formatType})`, quantity: i.quantity, price: i.price })),
    firstname,
    lastname,
    email: order.customerEmail,
    returnUrl: `${apiOrigin}/api/webhooks/payway`,
    continueSuccessUrl: `${clientOrigin}/checkout/success?tran_id=${order.paymentTranId}`,
    cancelUrl: `${clientOrigin}/checkout`,
    paymentOption,
  });
}

checkoutRouter.post("/checkout/session", requireCustomer, async (req, res) => {
  const user = req.user;
  const items = req.body?.items;
  const shippingName = String(req.body?.shippingName ?? "").trim();
  const shippingAddress = String(req.body?.shippingAddress ?? "").trim();
  const shippingProvince = String(req.body?.shippingProvince ?? "").trim();
  const method = req.body?.method === "cod" ? "cod" : "qr";
  const [firstname, ...rest] = (user.name || user.email).trim().split(/\s+/);
  const lastname = rest.join(" ") || "-";

  // Re-validated here, not just in the UI — nothing stops a direct POST
  // bypassing whatever the client shows/hides based on province.
  if (method === "cod" && shippingProvince !== COD_ELIGIBLE_PROVINCE) {
    return res.status(400).json({ error: "Cash on delivery is only available for Phnom Penh addresses." });
  }

  // If this customer already has a PayWay payment in flight, reuse the same
  // order and tran_id instead of reserving stock and starting a second,
  // parallel transaction — prevents a double-tab or retried request from
  // creating two separate charges for the same cart. Fields are rebuilt
  // fresh each time since req_time/hash are time-sensitive. Cash-on-delivery
  // orders are never left in this "pending" state (see below), so they're
  // never picked up here.
  if (method === "qr") {
    const existingPending = await getPendingOrderForCustomer(user.uid);
    if (existingPending) {
      const age = Date.now() - new Date(existingPending.createdAt).getTime();
      if (age < PENDING_ORDER_TTL_MS) {
        const fields = fieldsForOrder(existingPending, firstname, lastname, "abapay_khqr");
        return res.json(await buildResponsePayload(fields, existingPending.id, existingPending.paymentTranId));
      }
      // Stale — release its stock and let the customer start fresh below.
      for (const item of existingPending.items) {
        await adjustStock(item.bookId, item.formatType, item.quantity);
      }
      await deleteOrder(existingPending.id);
    }
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cart is empty." });
  }
  if (!shippingName || !shippingAddress) {
    return res.status(400).json({ error: "Shipping name and address are required." });
  }
  for (const item of items) {
    if (!item.bookId || !item.formatType || !Number.isFinite(item.quantity) || item.quantity <= 0) {
      return res.status(400).json({ error: "Invalid item in cart." });
    }
  }

  // Reserve stock up front, so two customers can't both "win" the last copy
  // while one is on PayWay's page. While we're here, also rebuild each item
  // from the server's own catalog data — the client payload only says which
  // book/format/quantity, never at what price. Trusting item.price straight
  // from the request would let someone submit { price: 0.01 } for a $16
  // book, the same class of tampering the PayWay hash protects against one
  // layer up the stack, just unprotected here unless enforced server-side too.
  const reserved = [];
  const verifiedItems = [];

  for (const item of items) {
    const result = await reserveStock(item.bookId, item.formatType, item.quantity);
    if (!result.ok) {
      for (const r of reserved) {
        await adjustStock(r.bookId, r.formatType, r.quantity);
      }
      const book = await getBook(item.bookId);
      const label = book?.title ?? item.title;
      return res.status(409).json({
        error:
          result.available === 0
            ? `"${label}" (${item.formatType}) is out of stock.`
            : `Only ${result.available} left of "${label}" (${item.formatType}).`,
      });
    }
    reserved.push({ bookId: item.bookId, formatType: item.formatType, quantity: item.quantity });

    const book = await getBook(item.bookId);
    const format = book?.formats.find((f) => f.type === item.formatType);
    verifiedItems.push({
      bookId: item.bookId,
      slug: book?.slug ?? item.bookId,
      title: book?.title ?? item.title,
      formatType: item.formatType,
      price: format?.price ?? 0,
      quantity: item.quantity,
      coverColor: book?.coverColor,
      genreIds: book?.genreIds,
    });
  }

  try {
    const total = verifiedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (method === "cod") {
      // No PayWay transaction at all — the order is confirmed immediately
      // (paymentStatus "cod" instead of "pending") since there's nothing
      // async to wait for; cash gets collected and marked paid on delivery.
      const orderId = await createOrder({
        customerUid: user.uid,
        customerEmail: user.email,
        items: verifiedItems,
        total,
        shippingName,
        shippingAddress,
        paymentStatus: "cod",
      });
      emitAdminEvent({ type: "order.created", orderId, customerEmail: user.email, total });
      await sendOrderConfirmationEmail({
        id: orderId,
        customerEmail: user.email,
        items: verifiedItems,
        total,
        shippingName,
        shippingAddress,
        paymentStatus: "cod",
      });
      return res.json({ orderId, cod: true });
    }

    const tranId = generateTranId();

    // Unlike Stripe's hosted-session-with-metadata model, PayWay has no
    // server-side session object we can attach our cart/shipping data to —
    // so we create the order now as "pending" and flip it to "paid" (or
    // release the stock) once PayWay's callback confirms the outcome.
    const orderId = await createOrder({
      customerUid: user.uid,
      customerEmail: user.email,
      items: verifiedItems,
      total,
      shippingName,
      shippingAddress,
      paymentTranId: tranId,
      paymentStatus: "pending",
    });

    const fields = fieldsForOrder(
      { paymentTranId: tranId, total, items: verifiedItems, customerEmail: user.email },
      firstname,
      lastname,
      "abapay_khqr"
    );

    res.json(await buildResponsePayload(fields, orderId, tranId));
  } catch (err) {
    // Session creation failed — release the stock we just reserved.
    for (const r of reserved) {
      await adjustStock(r.bookId, r.formatType, r.quantity);
    }
    throw err;
  }
});

checkoutRouter.get("/checkout/session/:tranId", requireCustomer, async (req, res) => {
  const tranId = req.params.tranId;
  const order = await getOrderByPaymentTranId(tranId);

  if (!order) {
    return res.json({ pending: true });
  }
  if (order.customerUid !== req.user.uid) {
    return res.status(403).json({ error: "Not your order." });
  }

  // The webhook (lib/payway.js's verifyCallback) is a fast-path, but its
  // signature scheme is still an educated guess — PayWay's docs never fully
  // pinned down the push-back format for the Purchase API. check-transaction-2
  // asks PayWay directly, with a hash scheme that IS precisely documented
  // (req_time + merchant_id + tran_id), so it's the authoritative source of
  // truth here: every poll actively re-confirms status instead of just
  // trusting whatever the webhook already wrote to the DB.
  if (order.paymentStatus === "pending") {
    try {
      const check = await checkTransactionStatus(tranId);
      if (check.ok && check.paid) {
        await setOrderPaymentStatus(order.id, "paid");
        emitAdminEvent({ type: "order.created", orderId: order.id, customerEmail: order.customerEmail, total: order.total });
        await sendOrderConfirmationEmail({ ...order, paymentStatus: "paid" });
        return res.json({ pending: false, orderId: order.id });
      }
      if (check.ok && check.failed) {
        await setOrderPaymentStatus(order.id, "failed");
        await setOrderStatus(order.id, "cancelled");
        for (const item of order.items) {
          await adjustStock(item.bookId, item.formatType, item.quantity);
        }
      }
    } catch (err) {
      console.error("[checkout] check-transaction-2 call failed:", err);
      // Fall through — keep polling, the webhook may still land.
    }
  }

  if (order.paymentStatus !== "paid") {
    return res.json({ pending: true });
  }

  res.json({ pending: false, orderId: order.id });
});
