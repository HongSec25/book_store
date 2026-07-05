import { Router } from "express";
import { requireAdmin, requireStaff } from "../middleware/auth.js";
import { listOrders } from "#lib/firestore/orders";
import { listBooks } from "#lib/firestore/books";
import { listAuditLogs } from "#lib/firestore/audit";
import { computeBestSellers, computeRevenueByDay, computeRevenueSummary } from "#lib/analytics";

export const analyticsRouter = Router();

analyticsRouter.get("/admin/analytics", requireAdmin, async (_req, res) => {
  const [orders, books] = await Promise.all([listOrders(), listBooks()]);
  res.json({
    summary: computeRevenueSummary(orders),
    byDay: computeRevenueByDay(orders, 14),
    bestSellers: computeBestSellers(orders, books, 5),
  });
});

analyticsRouter.get("/admin/audit-log", requireStaff, async (_req, res) => {
  res.json({ logs: await listAuditLogs(200) });
});
