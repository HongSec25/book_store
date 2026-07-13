import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { friendlyAuthError } from "@/lib/firebase/authErrors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Shared by /account/forgot-password and /admin/forgot-password — the reset
// flow itself is identical (Firebase Auth sends and handles the email),
// only the "back to sign in" destination differs.
export default function ForgotPasswordPage({ loginPath = "/account/login" }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      // Firebase intentionally reports "user not found" the same as success
      // in newer SDK versions when email enumeration protection is on, but
      // older/misconfigured projects can still leak it — normalize either way
      // so we never confirm or deny whether an email has an account.
      if (err?.code === "auth/user-not-found" || err?.code === "auth/invalid-email") {
        setSent(true);
      } else {
        setError(friendlyAuthError(err));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-background px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <p className="font-mono text-xs uppercase tracking-wider text-rust">Reset password</p>
          <CardTitle className="font-display text-2xl">Forgot your password?</CardTitle>
          <CardDescription>
            {sent
              ? "Check your inbox for a reset link."
              : "Enter your email and we'll send you a link to reset it."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm text-muted-foreground">
              If an account exists for <span className="text-ink">{email}</span>, a password reset
              email is on its way. It can take a few minutes to arrive — check your spam folder too.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          )}
          <Link to={loginPath} className="mt-4 block text-center text-sm text-rust underline">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
