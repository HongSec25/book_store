import { Router } from "express";
import { adminAuth } from "#lib/firebase/admin";
import { getUser, createUserProfile } from "#lib/firestore/users";
import { setSessionCookie, clearSessionCookie } from "#lib/session";
import { CAMBODIA_PROVINCES, citiesForProvince } from "#lib/cambodia-locations";

export const authRouter = Router();

authRouter.post("/customer-login", async (req, res) => {
  const { idToken } = req.body ?? {};
  if (typeof idToken !== "string" || !idToken) {
    return res.status(400).json({ error: "Missing idToken." });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const user = await getUser(decoded.uid);
  if (!user || user.disabled) {
    return res.status(403).json({ error: "This account is not authorized to sign in." });
  }
  if (user.role !== "customer") {
    return res.status(403).json({ error: "This is a staff account — please use the admin login instead." });
  }

  await setSessionCookie(res, idToken);
  res.json({ ok: true });
});

authRouter.post("/login", async (req, res) => {
  const { idToken } = req.body ?? {};
  if (typeof idToken !== "string" || !idToken) {
    return res.status(400).json({ error: "Missing idToken." });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const user = await getUser(decoded.uid);
  if (!user || user.disabled || (user.role !== "admin" && user.role !== "staff")) {
    return res.status(403).json({ error: "This account is not authorized for the admin dashboard." });
  }

  await setSessionCookie(res, idToken);
  res.json({ ok: true, role: user.role });
});

authRouter.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.post("/register", async (req, res) => {
  const { idToken, name, province, city } = req.body ?? {};
  if (typeof idToken !== "string" || !idToken) {
    return res.status(400).json({ error: "Missing idToken." });
  }

  const provinceTrimmed = typeof province === "string" ? province.trim() : "";
  const cityTrimmed = typeof city === "string" ? city.trim() : "";

  if (!provinceTrimmed || !CAMBODIA_PROVINCES.some((p) => p.name === provinceTrimmed)) {
    return res.status(400).json({ error: "Select a valid province." });
  }
  if (!cityTrimmed || !citiesForProvince(provinceTrimmed).includes(cityTrimmed)) {
    return res.status(400).json({ error: "Select a city/district that belongs to the chosen province." });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  await createUserProfile(
    decoded.uid,
    decoded.email ?? "",
    "customer",
    typeof name === "string" ? name.trim() : undefined,
    { province: provinceTrimmed, city: cityTrimmed }
  );

  await setSessionCookie(res, idToken);
  res.json({ ok: true });
});

/** New endpoint (didn't exist in the Next app) — the SPA replacement for
 * what Server Components got implicitly by calling verifySession() during
 * render. The client calls this once on mount to know who's signed in. */
authRouter.get("/me", (req, res) => {
  res.json({ user: req.user });
});
