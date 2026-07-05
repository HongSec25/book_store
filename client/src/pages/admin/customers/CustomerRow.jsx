import { useRef, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatDual } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function CustomerRow({ user, onChanged }) {
  const [pending, setPending] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user.name ?? "");
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState(user.email);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const passwordFormRef = useRef(null);

  async function handleSaveName() {
    setPending(true);
    try {
      await apiFetch(`/api/admin/customers/${user.uid}/name`, { method: "PATCH", body: JSON.stringify({ name, email: user.email }) });
      setEditingName(false);
      toast.success(`Updated name for ${user.email}`);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update name.");
    } finally {
      setPending(false);
    }
  }

  async function handleSaveEmail() {
    setPending(true);
    try {
      await apiFetch(`/api/admin/customers/${user.uid}/email`, {
        method: "PATCH",
        body: JSON.stringify({ email, currentEmail: user.email }),
      });
      setEditingEmail(false);
      toast.success(`Updated email to ${email}`);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update email.");
      setEmail(user.email);
    } finally {
      setPending(false);
    }
  }

  async function handlePasswordReset(e) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password") ?? "");
    setPending(true);
    try {
      await apiFetch(`/api/admin/customers/${user.uid}/password`, {
        method: "PATCH",
        body: JSON.stringify({ password, email: user.email }),
      });
      setPasswordDialogOpen(false);
      passwordFormRef.current?.reset();
      toast.success(`Password updated for ${user.email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setPending(false);
    }
  }

  async function handleToggleDisabled() {
    setPending(true);
    try {
      await apiFetch(`/api/admin/customers/${user.uid}/disabled`, {
        method: "PATCH",
        body: JSON.stringify({ disabled: !user.disabled, email: user.email }),
      });
      toast.success(user.disabled ? `${user.email} enabled` : `${user.email} disabled`);
      onChanged();
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete ${user.email}? This cannot be undone. Their past orders are kept.`)) return;
    await apiFetch(`/api/admin/customers/${user.uid}?email=${encodeURIComponent(user.email)}`, { method: "DELETE" });
    toast.success(`Deleted ${user.email}`);
    onChanged();
  }

  const initial = (user.name || user.email).charAt(0).toUpperCase();

  return (
    <div className="p-4 flex items-center justify-between gap-4 transition-colors hover:bg-muted/30">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rust/10 font-display font-black text-sm text-rust">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        {editingEmail ? (
          <div className="flex items-center gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="h-8 text-sm w-56"
              disabled={pending}
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handleSaveEmail} disabled={pending}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingEmail(false);
                setEmail(user.email);
              }}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <button onClick={() => setEditingEmail(true)} className="font-display font-bold text-ink hover:text-rust flex items-center gap-2">
            {user.email}
            {user.disabled && (
              <Badge variant="destructive" className="text-[10px]">
                disabled
              </Badge>
            )}
          </button>
        )}

        {editingName ? (
          <div className="flex items-center gap-2 mt-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer name"
              className="h-7 text-sm w-48"
              disabled={pending}
            />
            <Button size="sm" variant="ghost" onClick={handleSaveName} disabled={pending}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingName(false)} disabled={pending}>
              Cancel
            </Button>
          </div>
        ) : (
          <button onClick={() => setEditingName(true)} className="font-mono text-xs text-muted-foreground hover:text-ink">
            {user.name || "Add name"}
          </button>
        )}
        <p className="font-mono text-xs text-muted-foreground mt-1">
          joined {new Date(user.createdAt).toLocaleDateString()} &middot; {formatDual(user.totalSpent ?? 0)} spent
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogTrigger render={<Button variant="ghost" size="sm" disabled={pending} />}>Reset password</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset password for {user.email}</DialogTitle>
              <DialogDescription>They&apos;ll need to sign in with this new password.</DialogDescription>
            </DialogHeader>
            <form ref={passwordFormRef} onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor={`new-password-${user.uid}`}>New password</Label>
                <Input id={`new-password-${user.uid}`} name="password" type="text" minLength={6} required disabled={pending} autoFocus />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving..." : "Update password"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Button variant="ghost" size="sm" onClick={handleToggleDisabled} disabled={pending}>
          {user.disabled ? "Enable" : "Disable"}
        </Button>
        <Button variant="ghost" size="sm" disabled={pending} className="text-muted-foreground hover:text-destructive" onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}
