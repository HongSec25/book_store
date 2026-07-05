import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Settings, ShoppingCart, Store } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { Badge } from "@/components/ui/badge";
import LogoutButton from "@/components/LogoutButton";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function AccountLayout() {
  const { user } = useAuth();
  const { count } = useCart();
  const location = useLocation();

  const navItems = [
    { to: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
    { to: "/account/orders", label: "Orders", icon: ClipboardList },
    { to: "/account/settings", label: "Settings", icon: Settings },
  ];

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="print:hidden">
        <SidebarHeader>
          <span className="px-2 py-1 font-mono text-xs uppercase tracking-wider text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
            My account
          </span>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton render={<Link to={item.to} />} isActive={isActive} tooltip={item.label}>
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link to="/cart" />}
                    isActive={location.pathname.startsWith("/cart")}
                    tooltip="Cart"
                  >
                    <ShoppingCart />
                    <span>Cart</span>
                  </SidebarMenuButton>
                  {count > 0 && <SidebarMenuBadge>{count}</SidebarMenuBadge>}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<Link to="/" />} tooltip="Back to shop">
                    <Store />
                    <span>Back to shop</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:hidden">
            <Badge variant="secondary" className="truncate">
              {user.email}
            </Badge>
          </div>
          <div className="px-2 group-data-[collapsible=icon]:hidden">
            <LogoutButton redirectTo="/account/login" />
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex items-center gap-2 border-b border-border px-4 h-14 print:hidden">
          <SidebarTrigger />
        </header>
        <main className="flex-1 bg-background">
          <div className="mx-auto max-w-3xl p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
