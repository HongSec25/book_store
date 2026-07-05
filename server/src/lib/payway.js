import { createHmac } from "crypto";
/** ABA PayWay's hosted "Purchase" checkout: we build a signed set of form
 * fields server-side, the browser auto-submits them as a POST to PayWay's
 * checkout URL, and PayWay hosts the actual payment page (cards, ABA Mobile,
 * KHQR). PayWay confirms payment via a server-to-server push-back callback,
 * not a redirect — see app/api/webhooks/payway/route.ts. */
const DEFAULT_SANDBOX_BASE_URL = "https://checkout-sandbox.payway.com.kh";
function getBaseUrl() {
    return process.env.ABA_PAYWAY_BASE_URL || DEFAULT_SANDBOX_BASE_URL;
}
export function getPurchaseUrl() {
    return `${getBaseUrl()}/api/payment-gateway/v1/payments/purchase`;
}
function getCredentials() {
    const merchantId = process.env.PAYWAY_MERCHANT_ID;
    const apiKey = process.env.PAYWAY_API_KEY;
    if (!merchantId || !apiKey) {
        throw new Error("PAYWAY_MERCHANT_ID / PAYWAY_API_KEY are not set — add your PayWay sandbox credentials to .env.");
    }
    return { merchantId, apiKey };
}
/** yyyyMMddHHmmss in UTC, the format PayWay's req_time expects. */
export function formatReqTime(date = new Date()) {
    const pad = (n) => String(n).padStart(2, "0");
    return (date.getUTCFullYear().toString() +
        pad(date.getUTCMonth() + 1) +
        pad(date.getUTCDate()) +
        pad(date.getUTCHours()) +
        pad(date.getUTCMinutes()) +
        pad(date.getUTCSeconds()));
}
/** PayWay signs requests by HMAC-SHA512'ing a fixed concatenation of field
 * values (in this exact order) with the merchant's API key, base64-encoded.
 * Order per PayWay's Purchase API docs (developer.payway.com.kh): req_time,
 * merchant_id, tran_id, amount, items, shipping, firstname, lastname, email,
 * phone, type, payment_option, return_url, cancel_url, continue_success_url,
 * return_deeplink, currency, custom_fields, return_params, payout, lifetime,
 * additional_params, google_pay_token, skip_success_page. Every one of these
 * must be in the concatenation even when its value is empty — omitting an
 * optional field from the hash (this previously dropped `shipping` and
 * everything after `return_params`) produces a signature PayWay's server
 * can't reproduce, so it silently rejects the transaction. */
export function buildPurchaseFields(input) {
    const { merchantId, apiKey } = getCredentials();
    const reqTime = formatReqTime();
    const amount = input.amount.toFixed(2);
    const paymentOption = input.paymentOption ?? "";
    const shipping = input.shipping ?? "0.00";
    const itemsB64 = Buffer.from(JSON.stringify(input.items)).toString("base64");
    const returnUrlB64 = Buffer.from(input.returnUrl).toString("base64");
    const hashInput = reqTime +
        merchantId +
        input.tranId +
        amount +
        itemsB64 +
        shipping +
        input.firstname +
        input.lastname +
        input.email +
        "" + // phone (unused)
        "purchase" +
        paymentOption +
        returnUrlB64 +
        input.cancelUrl +
        input.continueSuccessUrl +
        "" + // return_deeplink
        input.currency +
        "" + // custom_fields
        "" + // return_params
        "" + // payout
        "" + // lifetime
        "" + // additional_params
        "" + // google_pay_token
        ""; // skip_success_page
    const hash = createHmac("sha512", apiKey).update(hashInput).digest("base64");
    return {
        req_time: reqTime,
        merchant_id: merchantId,
        tran_id: input.tranId,
        amount,
        items: itemsB64,
        shipping,
        firstname: input.firstname,
        lastname: input.lastname,
        email: input.email,
        type: "purchase",
        payment_option: paymentOption,
        return_url: returnUrlB64,
        cancel_url: input.cancelUrl,
        continue_success_url: input.continueSuccessUrl,
        currency: input.currency,
        hash,
    };
}
/** Posts the signed fields to PayWay's Purchase API ourselves (server-side)
 * instead of navigating the customer's browser there directly — this
 * merchant account returns JSON (a KHQR code + ABA Mobile deeplink to render
 * inline) rather than an HTML hosted-checkout page, so the browser can't just
 * be form-POSTed to it the way Stripe Checkout's redirect URL works. */
export async function submitPurchase(fields) {
    const body = new URLSearchParams(fields);
    const res = await fetch(getPurchaseUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });
    const data = await res.json();
    if (data?.status?.code !== "00") {
        return { ok: false, message: data?.status?.message ?? "PayWay rejected the payment request." };
    }
    return {
        ok: true,
        message: data.status.message,
        qrString: data.qrString,
        qrImage: data.qrImage,
        abapayDeeplink: data.abapay_deeplink,
    };
}
/** Scheme A: sort the callback's fields by key (ascending), concatenate the
 * values, HMAC-SHA512 + base64, compare against an X-PAYWAY-HMAC-SHA512
 * response header (per PayWay's push-back-notification docs). */
function verifyBySortedKeysHeader(fields, signatureHeader) {
    if (!signatureHeader)
        return false;
    const { apiKey } = getCredentials();
    const concatenated = Object.keys(fields)
        .sort()
        .map((k) => fields[k])
        .join("");
    const expected = createHmac("sha512", apiKey).update(concatenated).digest("base64");
    return expected === signatureHeader;
}
/** Scheme B (our original guess, unconfirmed): `tran_id + apv + status`
 * HMAC'd, sent back as a `hash` field in the callback body itself. */
function verifyByBodyHashField(fields) {
    const { apiKey } = getCredentials();
    const { tran_id, apv, status, hash } = fields;
    if (!hash)
        return false;
    const expected = createHmac("sha512", apiKey)
        .update(`${tran_id ?? ""}${apv ?? ""}${status ?? ""}`)
        .digest("base64");
    return expected === hash;
}
export function verifyCallback(fields, signatureHeader) {
    if (verifyBySortedKeysHeader(fields, signatureHeader))
        return { ok: true, scheme: "header-sorted-keys" };
    if (verifyByBodyHashField(fields))
        return { ok: true, scheme: "body-hash-field" };
    return { ok: false, scheme: "unverified" };
}

/** Actively asks PayWay "what's the real status of this transaction?"
 * instead of trusting an inbound callback we could never fully verify (see
 * verifyCallback above — its scheme is still a guess). This hash is short
 * and precisely documented (req_time + merchant_id + tran_id only), unlike
 * the webhook's, so it's the more trustworthy source of truth going forward.
 * The webhook stays wired up as a fast-path; this is the authoritative
 * fallback the poll endpoint calls on every check. */
export async function checkTransactionStatus(tranId) {
    const { merchantId, apiKey } = getCredentials();
    const reqTime = formatReqTime();
    const hash = createHmac("sha512", apiKey)
        .update(reqTime + merchantId + tranId)
        .digest("base64");

    const res = await fetch(`${getBaseUrl()}/api/payment-gateway/v1/payments/check-transaction-2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ req_time: reqTime, merchant_id: merchantId, tran_id: tranId, hash }),
    });
    const data = await res.json();

    if (data?.status?.code !== "00") {
        return { ok: false, message: data?.status?.message ?? "Could not check transaction status." };
    }

    const paymentStatusCode = data?.data?.payment_status_code;
    const paymentStatus = data?.data?.payment_status;
    const paid = paymentStatusCode === 0 && paymentStatus === "APPROVED";
    // Per PayWay's documented status codes: 0=APPROVED/PRE-AUTH, 2=PENDING,
    // 3=DECLINED, 4=REFUNDED, 7=CANCELLED. Only DECLINED/CANCELLED are actual
    // failures — treating "any non-zero code" as failed (the previous check)
    // wrongly killed the order the moment PayWay reported PENDING (code 2),
    // which is the normal state while the customer is still completing
    // payment in the popup.
    const failed = paymentStatus === "DECLINED" || paymentStatus === "CANCELLED";

    return { ok: true, paid, failed, raw: data };
}
