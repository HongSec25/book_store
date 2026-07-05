import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import UserRow from "./UserRow";

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => apiFetch("/api/admin/users"),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  }

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const { users } = data;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl text-ink">Staff & Admin ({users.length})</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus /> Invite a user
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New staff or admin account</DialogTitle>
            </DialogHeader>
            <InviteUserForm
              onCreated={() => {
                invalidate();
                setDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {users.map((u) => (
            <UserRow key={u.uid} user={u} isSelf={u.uid === me.uid} onChanged={invalidate} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function InviteUserForm({ onCreated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    try {
      await apiFetch("/api/admin/users", { method: "POST", body: JSON.stringify({ email, password, role }) });
      toast.success(`Created account for ${email}`);
      setEmail("");
      setPassword("");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="invite-email">Email</Label>
        <Input id="invite-email" type="email" required disabled={pending} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="invite-password">Temporary password</Label>
        <Input
          id="invite-password"
          minLength={6}
          required
          disabled={pending}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Role</Label>
        <Select value={role} onValueChange={setRole} disabled={pending}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating..." : "Create user"}
      </Button>
    </form>
  );
}
