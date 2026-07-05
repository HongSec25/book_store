import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Package,
  ClipboardList,
  Users,
  UserRound,
  History,
  Store,
  TrendingUp,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
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
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { to: "/admin/pos", label: "Point of Sale", icon: ShoppingBag },
    { to: "/admin/books", label: "Books", icon: BookOpen },
    { to: "/admin/inventory", label: "Inventory", icon: Package },
    { to: "/admin/orders", label: "Orders", icon: ClipboardList },
    ...(user.role === "admin"
      ? [
          { to: "/admin/analytics", label: "Analytics", icon: TrendingUp },
          { to: "/admin/users", label: "Users", icon: Users },
          { to: "/admin/customers", label: "Customers", icon: UserRound },
        ]
      : []),
    { to: "/admin/audit-log", label: "Audit Log", icon: History },
  ];

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="print:hidden">
        <SidebarHeader>
          <span className="px-2 py-1 font-mono text-xs uppercase tracking-wider text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
            Scorched Quarto
          </span>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
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
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<Link to="/" />} tooltip="View storefront">
                    <Store />
                    <span>View storefront</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:hidden">
            <Badge variant="secondary" className="capitalize">
              {user.role}
            </Badge>
            <span className="truncate font-mono text-xs text-sidebar-foreground/70">{user.email}</span>
          </div>
          <div className="px-2 group-data-[collapsible=icon]:hidden">
            <LogoutButton redirectTo="/admin/login" />
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex items-center gap-2 border-b border-border px-4 h-14 print:hidden">
          <SidebarTrigger />
        </header>
        <main className="flex-1 bg-background">
          <div className="mx-auto max-w-6xl p-6">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
