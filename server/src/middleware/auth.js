import { verifySession } from "#lib/session";

/** Runs on every request, attaches `req.user` (or null) — replaces the
 * implicit per-request auth that Next's Server Components had via
 * `verifySession()`. Mount this once, globally, before any routes. */
export async function attachUser(req, _res, next) {
  req.user = await verifySession(req);
  next();
}

/** Route guard replacing `requireUser`/`requireAdmin`/`requireStaff`/
 * `requireCustomer` — Next's versions called `redirect()` since they ran
 * inside a page render; Express routes are pure API calls, so they respond
 * with 401/403 JSON instead and let the client's <RequireAuth> decide what
 * to show/where to navigate. */
export function requireAuth(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "You must be signed in." });
    }
    if (roles && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have permission to do that." });
    }
    next();
  };
}

export const requireAdmin = requireAuth(["admin"]);
/** Staff or admin only — blocks customer accounts from the admin dashboard. */
export const requireStaff = requireAuth(["admin", "staff"]);
export const requireCustomer = requireAuth(["customer"]);
