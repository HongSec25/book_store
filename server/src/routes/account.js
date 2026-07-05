import { Router } from "express";
import { requireCustomer } from "../middleware/auth.js";
import { getUser, setUserName, setUserContactInfo } from "#lib/firestore/users";
import { listOrdersForCustomer, getOrder } from "#lib/firestore/orders";
import { CAMBODIA_PROVINCES, citiesForProvince } from "#lib/cambodia-locations";

export const accountRouter = Router();

accountRouter.get("/account/profile", requireCustomer, async (req, res) => {
  const profile = await getUser(req.user.uid);
  res.json({ profile });
});

accountRouter.patch("/account/name", requireCustomer, async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  if (name.length > 100) {
    return res.status(400).json({ error: "Name is too long." });
  }
  await setUserName(req.user.uid, name);
  res.json({ ok: true });
});

accountRouter.patch("/account/contact", requireCustomer, async (req, res) => {
  const phone = String(req.body?.phone ?? "").trim();
  const province = String(req.body?.province ?? "").trim();
  const city = String(req.body?.city ?? "").trim();
  const addressDetail = String(req.body?.addressDetail ?? "").trim();

  if (province && !CAMBODIA_PROVINCES.some((p) => p.name === province)) {
    return res.status(400).json({ error: "Unknown province." });
  }
  if (city && !citiesForProvince(province).includes(city)) {
    return res.status(400).json({ error: "Select a city/district that belongs to the chosen province." });
  }
  if (phone && !/^[0-9+\-\s]{6,20}$/.test(phone)) {
    return res.status(400).json({ error: "Enter a valid phone number." });
  }

  await setUserContactInfo(req.user.uid, { phone, province, city, addressDetail });
  res.json({ ok: true });
});

accountRouter.get("/account/orders", requireCustomer, async (req, res) => {
  const orders = await listOrdersForCustomer(req.user.uid);
  res.json({ orders });
});

accountRouter.get("/account/orders/:id", requireCustomer, async (req, res) => {
  const order = await getOrder(req.params.id);
  if (!order || order.customerUid !== req.user.uid) {
    return res.status(404).json({ error: "Order not found." });
  }
  res.json({ order });
});
