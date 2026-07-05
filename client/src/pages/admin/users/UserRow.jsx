import { useRef, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function UserRow({ user, isSelf, onChanged }) {
  const [pending, setPending] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const passwordFormRef = useRef(null);

  async function handleRoleChange(role) {
    if (role !== "admin" && role !== "staff") return;
    setPending(true);
    try {
      await apiFetch(`/api/admin/users/${user.uid}/role`, { method: "PATCH", body: JSON.stringify({ role, email: user.email }) });
      toast.success(`${user.email} is now ${role}`);
      onChanged();
    } finally {
      setPending(false);
    }
  }

  async function handleToggleDisabled() {
    setPending(true);
    try {
      await apiFetch(`/api/admin/users/${user.uid}/disabled`, {
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
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    await apiFetch(`/api/admin/users/${user.uid}?email=${encodeURIComponent(user.email)}`, { method: "DELETE" });
    toast.success(`Deleted ${user.email}`);
    onChanged();
  }

  async function handlePasswordReset(e) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password") ?? "");
    setPending(true);
    try {
      await apiFetch(`/api/admin/users/${user.uid}/password`, { method: "PATCH", body: JSON.stringify({ password, email: user.email }) });
      setPasswordDialogOpen(false);
      passwordFormRef.current?.reset();
      toast.success(`Password updated for ${user.email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="p-4 flex items-center justify-between">
      <div>
        <p className="font-display font-bold text-ink flex items-center gap-2">
          {user.email}
          {isSelf && (
            <Badge variant="outline" className="text-[10px]">
              you
            </Badge>
          )}
          {user.disabled && (
            <Badge variant="destructive" className="text-[10px]">
              disabled
            </Badge>
          )}
        </p>
        <p className="font-mono text-xs text-muted-foreground">joined {new Date(user.createdAt).toLocaleDateString()}</p>
      </div>
      <div className="flex items-center gap-3">
        <Select value={user.role} onValueChange={handleRoleChange} disabled={pending || isSelf}>
          <SelectTrigger size="sm" className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogTrigger render={<Button variant="ghost" size="sm" disabled={pending} />}>Reset password</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset password for {user.email}</DialogTitle>
              <DialogDescription>They&apos;ll need to sign in with this new password.</DialogDescription>
            </DialogHeader>
            <form ref={passwordFormRef} onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input id="new-password" name="password" type="text" minLength={6} required disabled={pending} autoFocus />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving..." : "Update password"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Button variant="ghost" size="sm" onClick={handleToggleDisabled} disabled={pending || isSelf}>
          {user.disabled ? "Enable" : "Disable"}
        </Button>
        <Button variant="ghost" size="sm" disabled={pending || isSelf} className="text-muted-foreground hover:text-destructive" onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}
