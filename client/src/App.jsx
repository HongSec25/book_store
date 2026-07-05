import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import SiteChrome from "@/components/SiteChrome";
import RequireAuth from "@/components/RequireAuth";
import HomePage from "@/pages/HomePage";
import BooksPage from "@/pages/BooksPage";
import BookDetailPage from "@/pages/BookDetailPage";
import ImprintsPage from "@/pages/ImprintsPage";
import ImprintDetailPage from "@/pages/ImprintDetailPage";
import AuthorsPage from "@/pages/AuthorsPage";
import AuthorDetailPage from "@/pages/AuthorDetailPage";
import CollectionsPage from "@/pages/CollectionsPage";
import CollectionDetailPage from "@/pages/CollectionDetailPage";
import AboutPage from "@/pages/AboutPage";
import NotFoundPage from "@/pages/NotFoundPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/checkout/CheckoutPage";
import CheckoutSuccessPage from "@/pages/checkout/CheckoutSuccessPage";
import CustomerLoginPage from "@/pages/account/CustomerLoginPage";
import RegisterPage from "@/pages/account/RegisterPage";
import AccountLayout from "@/pages/account/AccountLayout";
import AccountOverviewPage from "@/pages/account/AccountOverviewPage";
import AccountOrdersPage from "@/pages/account/AccountOrdersPage";
import OrderDetailPage from "@/pages/account/OrderDetailPage";
import OrderInvoicePage from "@/pages/account/OrderInvoicePage";
import AccountSettingsPage from "@/pages/account/AccountSettingsPage";

// The whole admin area (sidebar, book form, analytics, etc.) is a distinct
// section a regular shopper never visits — lazy-loading it keeps it out of
// the storefront's initial JS bundle entirely, splitting into its own
// chunk(s) fetched only when someone actually navigates to /admin/*.
const AdminLoginPage = lazy(() => import("@/pages/admin/AdminLoginPage"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminOverviewPage = lazy(() => import("@/pages/admin/AdminOverviewPage"));
const AdminBooksPage = lazy(() => import("@/pages/admin/books/AdminBooksPage"));
const BookFormPage = lazy(() => import("@/pages/admin/books/BookFormPage"));
const InventoryPage = lazy(() => import("@/pages/admin/InventoryPage"));
const PosPage = lazy(() => import("@/pages/admin/PosPage"));
const AdminOrdersPage = lazy(() => import("@/pages/admin/orders/AdminOrdersPage"));
const AdminOrderDetailPage = lazy(() => import("@/pages/admin/orders/AdminOrderDetailPage"));
const AdminOrderInvoicePage = lazy(() => import("@/pages/admin/orders/AdminOrderInvoicePage"));
const AdminCustomersPage = lazy(() => import("@/pages/admin/customers/AdminCustomersPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/users/AdminUsersPage"));
const AnalyticsPage = lazy(() => import("@/pages/admin/AnalyticsPage"));
const AuditLogPage = lazy(() => import("@/pages/admin/AuditLogPage"));

function AdminFallback() {
  return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
}

function App() {
  return (
    <SiteChrome>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/books/:slug" element={<BookDetailPage />} />
        <Route path="/imprints" element={<ImprintsPage />} />
        <Route path="/imprints/:slug" element={<ImprintDetailPage />} />
        <Route path="/authors" element={<AuthorsPage />} />
        <Route path="/authors/:slug" element={<AuthorDetailPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/:slug" element={<CollectionDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/account/login" element={<CustomerLoginPage />} />
        <Route path="/account/register" element={<RegisterPage />} />
        <Route
          path="/checkout"
          element={
            <RequireAuth roles={["customer"]}>
              <CheckoutPage />
            </RequireAuth>
          }
        />
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />

        <Route
          path="/account"
          element={
            <RequireAuth roles={["customer"]}>
              <AccountLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AccountOverviewPage />} />
          <Route path="orders" element={<AccountOrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="orders/:id/invoice" element={<OrderInvoicePage />} />
          <Route path="settings" element={<AccountSettingsPage />} />
        </Route>

        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<AdminFallback />}>
              <AdminLoginPage />
            </Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth roles={["admin", "staff"]} loginPath="/admin/login">
              {/* One boundary for the whole subtree — every child route below
                  renders through AdminLayout's <Outlet/>, so it's covered by
                  this same Suspense without needing one on every route. */}
              <Suspense fallback={<AdminFallback />}>
                <AdminLayout />
              </Suspense>
            </RequireAuth>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="books" element={<AdminBooksPage />} />
          <Route path="books/new" element={<BookFormPage mode="new" />} />
          <Route path="books/:id/edit" element={<BookFormPage mode="edit" />} />
          <Route path="pos" element={<PosPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="orders/:id/invoice" element={<AdminOrderInvoicePage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SiteChrome>
  );
}

export default App;
