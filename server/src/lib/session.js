import { adminAuth, adminDb } from "#lib/firebase/admin";
import { DB_PROVIDER } from "#lib/db-provider";
import { getUser as getMysqlUser } from "#lib/mysql/users";

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

/** Mints a Firebase session cookie from a client ID token and sets it on the
 * Express response — the direct replacement for Next's `cookies().set(...)`. */
export async function setSessionCookie(res, idToken) {
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
  // Client (Firebase Hosting) and API (Render) are different origins in
  // production, so the cookie needs SameSite=None to be sent cross-site —
  // that requires Secure, which is fine since both hosts are HTTPS-only.
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

/** Verifies the session cookie on an Express request and returns the
 * current user, or null. No more React `cache()` — that was Next's
 * per-request memoization for Server Components; here each request is its
 * own Express request, so there's nothing to dedupe across. */
export async function verifySession(req) {
  const sessionCookie = req.cookies?.[SESSION_COOKIE];
  if (!sessionCookie) return null;

  try {
    // checkRevoked is intentionally off: it costs a network round-trip to Firebase on every
    // request, and we already re-check `disabled` against our own DB below on every request,
    // which covers the same "was this account just deactivated" case without the extra latency.
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);

    if (DB_PROVIDER === "mysql") {
      const user = await getMysqlUser(decoded.uid);
      if (!user || user.disabled) return null;
      return { uid: decoded.uid, email: decoded.email ?? user.email, role: user.role, name: user.name };
    }

    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    if (!userDoc.exists) return null;
    const data = userDoc.data();
    if (data.disabled) return null;
    return { uid: decoded.uid, email: decoded.email ?? data.email, role: data.role, name: data.name };
  } catch {
    return null;
  }
}
