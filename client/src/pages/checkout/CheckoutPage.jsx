import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import CheckoutForm from "./CheckoutForm";

function composeAddress(profile) {
  if (!profile) return "";
  const parts = [profile.addressDetail, profile.city, profile.province].filter(Boolean);
  const lines = [parts.join(", ")];
  if (profile.phone) lines.push(`Phone: ${profile.phone}`);
  return lines.filter(Boolean).join("\n");
}

export default function CheckoutPage() {
  useDocumentTitle("Checkout");
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["account", "profile"],
    queryFn: () => apiFetch("/api/account/profile"),
  });

  if (isLoading) return <p className="text-center py-16 text-muted-foreground">Loading…</p>;

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-display font-black text-4xl text-ink text-center mb-10">Checkout</h1>
      <CheckoutForm
        email={user.email}
        defaultName={user.name ?? ""}
        defaultAddress={composeAddress(data?.profile)}
        province={data?.profile?.province ?? ""}
      />
    </main>
  );
}
