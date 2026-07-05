import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

/** Route guard replacing proxy.ts's cookie-presence redirect — shows a brief
 * loading state during the initial /api/auth/me check (unavoidable in a pure
 * client-rendered SPA, unlike Next's redirect-before-paint), then either
 * renders the protected route or bounces to the right login page. */
export default function RequireAuth({ roles, loginPath = "/account/login", children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  if (!user || (roles && !roles.includes(user.role))) {
    return <Navigate to={`${loginPath}?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
}
