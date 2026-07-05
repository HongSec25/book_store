import { Router } from "express";
import multer from "multer";
import { requireStaff, requireAdmin } from "../middleware/auth.js";
import { logAudit } from "#lib/audit";
import { emitAdminEvent } from "#lib/events";
import { sendOrderStatusUpdateEmail } from "#lib/email";
import { isTerminalOrderStatus } from "#lib/types";
import { computeCustomerSpend } from "#lib/analytics";
import {
  listBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  adjustStock,
  setStock,
  reserveStock,
  createAuthor,
  createImprint,
  createCollection,
  listReferenceData,
} from "#lib/firestore/books";
import {
  listOrders,
  getOrder,
  createOrder,
  setOrderStatus,
  deleteOrder,
  ORDER_STATUSES,
} from "#lib/firestore/orders";
import {
  listUsers,
  inviteUser,
  setUserName,
  setUserEmail,
  setUserPassword,
  setUserDisabled,
  setUserRole,
  deleteUser,
} from "#lib/firestore/users";
import { saveCover } from "#lib/covers.server";

export const adminRouter = Router();
const upload = multer();

const FORMAT_TYPES = ["hardcover", "ebook", "audio"];

function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// ---------- Books ----------

adminRouter.get("/admin/books", requireStaff, async (_req, res) => {
  const [books, refData] = await Promise.all([listBooks(), listReferenceData()]);
  res.json({ books, ...refData });
});

adminRouter.get("/admin/books/:id", requireStaff, async (req, res) => {
  const book = await getBook(req.params.id);
  if (!book) return res.status(404).json({ error: "Book not found." });
  res.json({ book });
});

adminRouter.post("/admin/books", requireStaff, upload.single("cover"), async (req, res) => {
  const b = req.body;
  const title = String(b.title ?? "").trim();
  const slug = slugify(title);
  const book = {
    id: `b-${slug}`,
    title,
    slug,
    coverColor: b.coverColor || "#8C7A5B",
    imprintId: b.imprintId,
    authorId: b.authorId,
    genreIds: Array.isArray(b.genreIds) ? b.genreIds : b.genreIds ? [b.genreIds] : [],
    collectionIds: Array.isArray(b.collectionIds) ? b.collectionIds : b.collectionIds ? [b.collectionIds] : [],
    publishDate: b.publishDate,
    isNewRelease: b.isNewRelease === "true" || b.isNewRelease === true,
    isComingSoon: b.isComingSoon === "true" || b.isComingSoon === true,
    isBestseller: b.isBestseller === "true" || b.isBestseller === true,
    isCultClassic: b.isCultClassic === "true" || b.isCultClassic === true,
    synopsis: b.synopsis ?? "",
    pullQuote: b.pullQuote ?? "",
    formats: JSON.parse(b.formats ?? "[]"),
    contentWarnings: (b.contentWarnings ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    isbn: b.isbn ?? "",
  };

  await createBook(book);
  if (req.file) saveCover(slug, req.file.mimetype.split("/")[1], req.file.buffer);
  await logAudit(req.user, "book.create", { type: "book", id: book.id, label: book.title });
  res.json({ book });
});

adminRouter.put("/admin/books/:id", requireStaff, upload.single("cover"), async (req, res) => {
  const b = req.body;
  const id = req.params.id;
  const book = {
    id,
    title: b.title,
    slug: b.slug,
    coverColor: b.coverColor || "#8C7A5B",
    imprintId: b.imprintId,
    authorId: b.authorId,
    genreIds: Array.isArray(b.genreIds) ? b.genreIds : b.genreIds ? [b.genreIds] : [],
    collectionIds: Array.isArray(b.collectionIds) ? b.collectionIds : b.collectionIds ? [b.collectionIds] : [],
    publishDate: b.publishDate,
    isNewRelease: b.isNewRelease === "true" || b.isNewRelease === true,
    isComingSoon: b.isComingSoon === "true" || b.isComingSoon === true,
    isBestseller: b.isBestseller === "true" || b.isBestseller === true,
    isCultClassic: b.isCultClassic === "true" || b.isCultClassic === true,
    synopsis: b.synopsis ?? "",
    pullQuote: b.pullQuote ?? "",
    formats: JSON.parse(b.formats ?? "[]"),
    contentWarnings: (b.contentWarnings ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    isbn: b.isbn ?? "",
  };

  await updateBook(id, book);
  if (req.file) saveCover(book.slug, req.file.mimetype.split("/")[1], req.file.buffer);
  await logAudit(req.user, "book.update", { type: "book", id: book.id, label: book.title });
  res.json({ book });
});

adminRouter.delete("/admin/books/:id", requireStaff, async (req, res) => {
  const book = await getBook(req.params.id);
  await deleteBook(req.params.id);
  await logAudit(req.user, "book.delete", { type: "book", id: req.params.id, label: book?.title ?? req.params.id });
  res.json({ ok: true });
});

adminRouter.post("/admin/authors", requireStaff, async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  if (!name) return res.status(400).json({ error: "Author name is required." });
  const bio = String(req.body?.bio ?? "").trim();
  const slugBase = slugify(name);
  const suffix = Math.random().toString(36).slice(2, 6);
  const author = { id: `a-${slugBase}-${suffix}`, name, slug: `${slugBase}-${suffix}`, bio };
  await createAuthor(author);
  await logAudit(req.user, "author.create", { type: "author", id: author.id, label: author.name });
  res.json({ author });
});

adminRouter.post("/admin/imprints", requireStaff, async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  if (!name) return res.status(400).json({ error: "Imprint name is required." });
  const color = String(req.body?.color ?? "#8C7A5B").trim();
  const blurb = String(req.body?.blurb ?? "").trim();
  const slugBase = slugify(name);
  const suffix = Math.random().toString(36).slice(2, 6);
  const imprint = { id: `imp-${slugBase}-${suffix}`, name, slug: `${slugBase}-${suffix}`, color, blurb };
  await createImprint(imprint);
  await logAudit(req.user, "imprint.create", { type: "imprint", id: imprint.id, label: imprint.name });
  res.json({ imprint });
});

adminRouter.post("/admin/collections", requireStaff, async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  if (!name) return res.status(400).json({ error: "Collection name is required." });
  const description = String(req.body?.description ?? "").trim();
  const slugBase = slugify(name);
  const suffix = Math.random().toString(36).slice(2, 6);
  const collection = { id: `c-${slugBase}-${suffix}`, name, slug: `${slugBase}-${suffix}`, description, curatedBookIds: [] };
  await createCollection(collection);
  await logAudit(req.user, "collection.create", { type: "collection", id: collection.id, label: collection.name });
  res.json({ collection });
});

// ---------- Inventory ----------

adminRouter.get("/admin/inventory", requireStaff, async (_req, res) => {
  res.json({ books: await listBooks() });
});

adminRouter.post("/admin/inventory/restock", requireStaff, async (req, res) => {
  const { bookId, formatType, quantity } = req.body ?? {};
  const qty = Math.trunc(Number(quantity));

  if (!bookId || !FORMAT_TYPES.includes(formatType)) {
    return res.status(400).json({ error: "Unknown book or format." });
  }
  if (!Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ error: "Enter a positive quantity to add to stock." });
  }

  const updated = await adjustStock(bookId, formatType, qty);
  if (!updated) return res.status(404).json({ error: "Book or format not found." });

  const book = await getBook(bookId);
  await logAudit(
    req.user,
    "book.restock",
    { type: "book", id: bookId, label: book?.title ?? bookId },
    { formatType, quantityAdded: qty, newStockCount: updated.stockCount }
  );
  res.json({ ok: true, format: updated });
});

adminRouter.post("/admin/inventory/reset", requireStaff, async (req, res) => {
  const { bookId, formatType } = req.body ?? {};
  if (!bookId || !FORMAT_TYPES.includes(formatType)) {
    return res.status(400).json({ error: "Unknown book or format." });
  }

  const updated = await setStock(bookId, formatType, 0);
  if (!updated) return res.status(404).json({ error: "Book or format not found." });

  const book = await getBook(bookId);
  await logAudit(req.user, "book.stock_reset", { type: "book", id: bookId, label: book?.title ?? bookId }, { formatType });
  res.json({ ok: true });
});

// ---------- POS (in-store sales) ----------

// Sentinel identity for walk-in sales — no customer account exists for
// these, but customerUid/customerEmail are NOT NULL columns, and reusing
// them (rather than relaxing the schema) keeps every other order-reading
// code path (admin orders list, "bought together", analytics) working
// unchanged for in-store sales.
const POS_CUSTOMER_UID = "pos-walkin";
const POS_CUSTOMER_EMAIL = "walkin@in-store.local";

adminRouter.post("/admin/pos/sale", requireStaff, async (req, res) => {
  const items = req.body?.items;
  const cashTendered = Number(req.body?.cashTendered);

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Add at least one item to the sale." });
  }
  for (const item of items) {
    if (!item.bookId || !FORMAT_TYPES.includes(item.formatType) || !Number.isFinite(item.quantity) || item.quantity <= 0) {
      return res.status(400).json({ error: "Invalid item in sale." });
    }
  }
  if (!Number.isFinite(cashTendered) || cashTendered < 0) {
    return res.status(400).json({ error: "Enter the cash amount received." });
  }

  // Same reserve-then-verify-price pattern as the online checkout: reserve
  // stock up front so two sales can't both claim the last copy, and rebuild
  // each line item's price from the server's own catalog data rather than
  // trusting whatever the POS screen last had cached.
  const reserved = [];
  const verifiedItems = [];
  for (const item of items) {
    const result = await reserveStock(item.bookId, item.formatType, item.quantity);
    if (!result.ok) {
      for (const r of reserved) await adjustStock(r.bookId, r.formatType, r.quantity);
      const book = await getBook(item.bookId);
      const label = book?.title ?? item.bookId;
      return res.status(409).json({
        error:
          result.available === 0
            ? `"${label}" (${item.formatType}) is out of stock.`
            : `Only ${result.available} left of "${label}" (${item.formatType}).`,
      });
    }
    reserved.push({ bookId: item.bookId, formatType: item.formatType, quantity: item.quantity });

    const book = await getBook(item.bookId);
    const format = book?.formats.find((f) => f.type === item.formatType);
    verifiedItems.push({
      bookId: item.bookId,
      slug: book?.slug ?? item.bookId,
      title: book?.title ?? "Unknown title",
      formatType: item.formatType,
      price: format?.price ?? 0,
      quantity: item.quantity,
      coverColor: book?.coverColor,
      genreIds: book?.genreIds,
    });
  }

  const total = verifiedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (cashTendered < total) {
    for (const r of reserved) await adjustStock(r.bookId, r.formatType, r.quantity);
    return res.status(400).json({ error: "Cash tendered is less than the total." });
  }
  const change = Math.round((cashTendered - total) * 100) / 100;

  const orderId = await createOrder({
    customerUid: POS_CUSTOMER_UID,
    customerEmail: POS_CUSTOMER_EMAIL,
    items: verifiedItems,
    total,
    shippingName: "In-store customer",
    shippingAddress: "Walk-in purchase — no shipping.",
    paymentStatus: "paid",
    channel: "in_store",
  });

  await logAudit(req.user, "pos.sale", { type: "order", id: orderId, label: `In-store sale — $${total.toFixed(2)}` }, {
    itemCount: verifiedItems.length,
    total,
  });
  emitAdminEvent({ type: "order.created", orderId, customerEmail: POS_CUSTOMER_EMAIL, total });

  res.json({ orderId, total, cashTendered, change, items: verifiedItems });
});

// ---------- Orders ----------

adminRouter.get("/admin/orders", requireStaff, async (_req, res) => {
  res.json({ orders: await listOrders() });
});

adminRouter.get("/admin/orders/:id", requireStaff, async (req, res) => {
  const order = await getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found." });
  res.json({ order });
});

adminRouter.patch("/admin/orders/:id/status", requireStaff, async (req, res) => {
  const { status } = req.body ?? {};
  const id = req.params.id;

  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Unknown order status." });
  }

  const order = await getOrder(id);
  if (!order) return res.status(404).json({ error: "Order not found." });
  if (isTerminalOrderStatus(order.status)) {
    return res.status(400).json({ error: `Order is already ${order.status} and cannot be changed further.` });
  }

  // Cancelling a still-active order releases its reserved stock back to inventory.
  if (status === "cancelled" && order.status !== "cancelled") {
    for (const item of order.items) {
      await adjustStock(item.bookId, item.formatType, item.quantity);
    }
  }

  await setOrderStatus(id, status);
  await logAudit(
    req.user,
    "order.status_change",
    { type: "order", id, label: `Order #${id.slice(0, 8)}` },
    { from: order.status, to: status }
  );
  emitAdminEvent({ type: "order.status_changed", orderId: id, status });
  await sendOrderStatusUpdateEmail({ ...order, status }, status);

  res.json({ ok: true });
});

adminRouter.delete("/admin/orders/:id", requireStaff, async (req, res) => {
  const id = req.params.id;
  const order = await getOrder(id);
  if (!order) return res.status(404).json({ error: "Order not found." });

  if (!isTerminalOrderStatus(order.status)) {
    for (const item of order.items) {
      await adjustStock(item.bookId, item.formatType, item.quantity);
    }
  }

  await deleteOrder(id);
  await logAudit(req.user, "order.delete", { type: "order", id, label: `Order #${id.slice(0, 8)}` }, { status: order.status });
  res.json({ ok: true });
});

// ---------- Customers ----------

adminRouter.get("/admin/customers", requireAdmin, async (_req, res) => {
  const [allUsers, orders] = await Promise.all([listUsers(), listOrders()]);
  const customers = allUsers.filter((u) => u.role === "customer");
  const spendByUid = computeCustomerSpend(orders);
  const orderCountByUid = orders.reduce((acc, order) => {
    acc[order.customerUid] = (acc[order.customerUid] ?? 0) + 1;
    return acc;
  }, {});

  res.json({
    customers: customers.map((c) => ({
      ...c,
      totalSpent: spendByUid[c.uid] ?? 0,
      orderCount: orderCountByUid[c.uid] ?? 0,
    })),
  });
});

adminRouter.post("/admin/customers", requireAdmin, async (req, res) => {
  const email = String(req.body?.email ?? "").trim();
  const password = String(req.body?.password ?? "");
  const name = String(req.body?.name ?? "").trim();

  if (!email || password.length < 6) {
    return res.status(400).json({ error: "Email and a password of at least 6 characters are required." });
  }

  const uid = await inviteUser(email, password, "customer");
  if (name) await setUserName(uid, name);

  await logAudit(req.user, "user.invite", { type: "user", id: uid, label: email }, { role: "customer" });
  res.json({ ok: true, uid });
});

adminRouter.patch("/admin/customers/:uid/name", requireAdmin, async (req, res) => {
  const { name, email } = req.body ?? {};
  await setUserName(req.params.uid, String(name ?? "").trim());
  await logAudit(req.user, "user.update", { type: "user", id: req.params.uid, label: email }, { name });
  res.json({ ok: true });
});

adminRouter.patch("/admin/customers/:uid/email", requireAdmin, async (req, res) => {
  const { email: newEmail, currentEmail } = req.body ?? {};
  const trimmed = String(newEmail ?? "").trim();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  await setUserEmail(req.params.uid, trimmed);
  await logAudit(req.user, "user.update", { type: "user", id: req.params.uid, label: currentEmail }, { email: trimmed });
  res.json({ ok: true });
});

adminRouter.patch("/admin/customers/:uid/password", requireAdmin, async (req, res) => {
  const { password, email } = req.body ?? {};
  if (String(password ?? "").length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  await setUserPassword(req.params.uid, password);
  await logAudit(req.user, "user.password_reset", { type: "user", id: req.params.uid, label: email });
  res.json({ ok: true });
});

adminRouter.patch("/admin/customers/:uid/disabled", requireAdmin, async (req, res) => {
  const { disabled, email } = req.body ?? {};
  await setUserDisabled(req.params.uid, Boolean(disabled));
  await logAudit(req.user, disabled ? "user.disable" : "user.enable", { type: "user", id: req.params.uid, label: email });
  res.json({ ok: true });
});

adminRouter.delete("/admin/customers/:uid", requireAdmin, async (req, res) => {
  const email = req.query.email;
  await deleteUser(req.params.uid);
  await logAudit(req.user, "user.delete", { type: "user", id: req.params.uid, label: email });
  res.json({ ok: true });
});

// ---------- Staff/Admin users ----------

adminRouter.get("/admin/users", requireAdmin, async (_req, res) => {
  const allUsers = await listUsers();
  res.json({ users: allUsers.filter((u) => u.role !== "customer") });
});

adminRouter.post("/admin/users", requireAdmin, async (req, res) => {
  const email = String(req.body?.email ?? "").trim();
  const password = String(req.body?.password ?? "");
  const role = req.body?.role === "admin" ? "admin" : "staff";

  if (!email || password.length < 6) {
    return res.status(400).json({ error: "Email and a password of at least 6 characters are required." });
  }

  const uid = await inviteUser(email, password, role);
  await logAudit(req.user, "user.invite", { type: "user", id: uid, label: email }, { role });
  res.json({ ok: true, uid });
});

adminRouter.patch("/admin/users/:uid/role", requireAdmin, async (req, res) => {
  const { role, email } = req.body ?? {};
  if (role !== "admin" && role !== "staff") return res.status(400).json({ error: "Invalid role." });
  await setUserRole(req.params.uid, role);
  await logAudit(req.user, "user.role_change", { type: "user", id: req.params.uid, label: email }, { role });
  res.json({ ok: true });
});

adminRouter.patch("/admin/users/:uid/disabled", requireAdmin, async (req, res) => {
  const { disabled, email } = req.body ?? {};
  await setUserDisabled(req.params.uid, Boolean(disabled));
  await logAudit(req.user, disabled ? "user.disable" : "user.enable", { type: "user", id: req.params.uid, label: email });
  res.json({ ok: true });
});

adminRouter.patch("/admin/users/:uid/password", requireAdmin, async (req, res) => {
  const { password, email } = req.body ?? {};
  if (String(password ?? "").length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  await setUserPassword(req.params.uid, password);
  await logAudit(req.user, "user.password_reset", { type: "user", id: req.params.uid, label: email });
  res.json({ ok: true });
});

adminRouter.delete("/admin/users/:uid", requireAdmin, async (req, res) => {
  const email = req.query.email;
  await deleteUser(req.params.uid);
  await logAudit(req.user, "user.delete", { type: "user", id: req.params.uid, label: email });
  res.json({ ok: true });
});

// ---------- Cover upload (standalone, e.g. from admin book list) ----------

adminRouter.post("/admin/covers", requireStaff, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  const slug = String(req.body?.slug ?? "").trim();
  if (!slug) return res.status(400).json({ error: "Missing slug." });
  const ext = req.file.mimetype.split("/")[1];
  const url = saveCover(slug, ext, req.file.buffer);
  res.json({ url });
});
