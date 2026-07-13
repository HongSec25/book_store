// Firebase errors carry a `.code` (e.g. "auth/wrong-password") that's a far
// more reliable thing to branch on than regex-cleaning `.message` — that
// message's exact wording/format isn't a stable contract, and stripping the
// "Firebase: " prefix and "(auth/xxx)" suffix left a bare "Error." on
// screen for the common wrong-password case (nothing left after both
// strips). Branch on the code instead, with real copy per case.
const MESSAGES = {
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-not-found": "No account found with that email.",
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/too-many-requests": "Too many attempts — please wait a moment and try again.",
  "auth/email-already-in-use": "An account with that email already exists.",
  "auth/weak-password": "Choose a stronger password (at least 6 characters).",
  "auth/user-disabled": "This account has been disabled.",
  "auth/network-request-failed": "Couldn't reach the server — check your connection and try again.",
};

export function friendlyAuthError(err, fallback = "Something went wrong. Please try again.") {
  const code = err && typeof err === "object" ? err.code : undefined;
  if (code && MESSAGES[code]) return MESSAGES[code];
  // Not a Firebase error (or an unmapped code) — most likely our own API
  // throwing with a real, already-human-readable message (e.g. "This
  // account is not authorized for the admin dashboard."), so pass it
  // through rather than swallowing it into the generic fallback.
  if (err instanceof Error && err.message && !code) return err.message;
  return fallback;
}
