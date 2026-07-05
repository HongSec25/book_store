import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Users, Wallet, UserX } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDual } from "@/lib/currency";
import CustomerRow from "./CustomerRow";

export default function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => apiFetch("/api/admin/customers"),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
  }

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const { customers } = data;
  const totalSpent = customers.reduce((sum, c) => sum + (c.totalSpent ?? 0), 0);
  const disabledCount = customers.filter((c) => c.disabled).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between animate-fade-up">
        <h1 className="font-display font-bold text-2xl text-ink">Customers ({customers.length})</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus /> Add a customer
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New customer account</DialogTitle>
            </DialogHeader>
            <CreateCustomerForm
              onCreated={() => {
                invalidate();
                setDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile index={0} icon={Users} label="Customers" value={customers.length} />
        <StatTile index={1} icon={Wallet} label="Total spent" value={formatDual(totalSpent)} />
        <StatTile index={2} icon={UserX} label="Disabled" value={disabledCount} />
      </div>

      <Card className="animate-fade-up" style={{ animationDelay: "150ms" }}>
        <CardContent className="p-0 divide-y divide-border">
          {customers.length === 0 && <p className="p-4 text-sm text-muted-foreground">No customer accounts yet.</p>}
          {customers.map((c) => (
            <CustomerRow key={c.uid} user={c} onChanged={invalidate} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({ index, icon: Icon, label, value }) {
  return (
    <Card className="animate-fade-up transition-all duration-200 hover:-translate-y-1 hover:shadow-lg" style={{ animationDelay: `${index * 80}ms` }}>
      <CardContent className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rust/10 text-rust">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-display font-black text-xl text-ink">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateCustomerForm({ onCreated }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    try {
      await apiFetch("/api/admin/customers", { method: "POST", body: JSON.stringify({ email, name, password }) });
      toast.success(`Created customer ${email}`);
      setEmail("");
      setName("");
      setPassword("");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create customer.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="customer-email">Email</Label>
        <Input id="customer-email" type="email" required disabled={pending} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="customer-name">Name (optional)</Label>
        <Input id="customer-name" disabled={pending} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="customer-password">Temporary password</Label>
        <Input
          id="customer-password"
          minLength={6}
          required
          disabled={pending}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating..." : "Create customer"}
      </Button>
    </form>
  );
}
