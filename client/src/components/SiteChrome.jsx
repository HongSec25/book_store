import { useLocation } from "react-router-dom";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageTransition from "@/components/motion/PageTransition";

export default function SiteChrome({ children }) {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  const isAccountDashboard =
    pathname.startsWith("/account") && !pathname.startsWith("/account/login") && !pathname.startsWith("/account/register");

  if (isAdmin || isAccountDashboard) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        <PageTransition key={pathname}>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  );
}
