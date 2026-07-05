import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function LogoutButton({ redirectTo = "/admin/login" }) {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  async function handleLogout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    await refresh();
    navigate(redirectTo);
  }

  return (
    <Button onClick={handleLogout} variant="secondary" size="sm">
      Log out
    </Button>
  );
}
