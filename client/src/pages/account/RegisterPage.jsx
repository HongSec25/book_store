import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { friendlyAuthError } from "@/lib/firebase/authErrors";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { CAMBODIA_PROVINCES, citiesForProvince } from "@/lib/cambodia-locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  const cities = citiesForProvince(province);

  function handleProvinceChange(next) {
    if (!next) return;
    setProvince(next);
    setCity("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!province || !city) {
      setError("Select your province and city.");
      return;
    }

    setPending(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ idToken, name, province, city }),
      });

      toast.success("Account created — welcome!");
      await refresh();
      navigate("/account");
    } catch (err) {
      setError(friendlyAuthError(err, "Registration failed."));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-background px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <p className="font-mono text-xs uppercase tracking-wider text-rust">Create account</p>
          <CardTitle className="font-display text-2xl">Join Scorched Quarto</CardTitle>
          <CardDescription>Save your details and track your orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={pending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={pending}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Province</Label>
              <Select value={province} onValueChange={handleProvinceChange} disabled={pending}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {CAMBODIA_PROVINCES.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>City / District</Label>
              <Select value={city} onValueChange={(v) => v && setCity(v)} disabled={pending || !province}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={province ? "Select city" : "Choose a province first"} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/account/login" className="text-rust underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
