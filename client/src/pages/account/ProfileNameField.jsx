import { useState } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProfileNameField({ initialName, email }) {
  const { refresh } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [pending, setPending] = useState(false);

  async function handleSave() {
    setPending(true);
    try {
      await apiFetch("/api/account/name", { method: "PATCH", body: JSON.stringify({ name }) });
      setEditing(false);
      toast.success("Profile updated");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setPending(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="h-9 max-w-56"
          disabled={pending}
          autoFocus
        />
        <Button size="sm" onClick={handleSave} disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center gap-2 font-display font-black text-3xl text-ink hover:text-rust"
    >
      {initialName || email}
      <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
    </button>
  );
}
