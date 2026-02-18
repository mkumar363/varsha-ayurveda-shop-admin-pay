const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { nanoid } = require("nanoid");

const { readDb, writeDb } = require("./db");
const { requireAdminAny, hasAdminKey, hasAdminRole } = require("./auth");
const { signToken, sanitizeUser, requireAuth, optionalAuth } = require("./userAuth");

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

const allowlist = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    // Postman/curl me origin null hota hai
    if (!origin) return cb(null, true);

    // If env not set => allow all (easy mode)
    if (allowlist.length === 0) return cb(null, true);

    // Allow only listed origins
    if (allowlist.includes(origin)) return cb(null, true);

    // Block others
    return cb(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-key"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // ✅ preflight support

app.use(express.json({ limit: "1mb" }));

// Attach req.user if a Bearer token exists.
app.use(optionalAuth);

function isAdminRequest(req) {
  return hasAdminKey(req) || hasAdminRole(req);
}

function nowIso() {
  return new Date().toISOString();
}

async function ensureAdminUser() {
  const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || "");
  if (!email || !password) return;
  if (!email.includes("@") || password.length < 6) return;

  const db = await readDb();
  db.users = db.users || [];

  const existing = db.users.find((u) => String(u.email).toLowerCase() === email);
  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      existing.updatedAt = nowIso();
      await writeDb(db);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: "usr_" + nanoid(10),
    name: "Admin",
    email,
    role: "admin",
    passwordHash,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  db.users.unshift(user);
  await writeDb(db);

  console.log(`✅ Admin user created: ${email}`);
}

function sanitizeCustomer(input) {
  if (!input || typeof input !== "object") return null;
  const name = String(input.name || "").trim();
  const phone = String(input.phone || "").trim();
  const email = String(input.email || "").trim();
  const address = String(input.address || "").trim();
  if (name.length < 2) return { error: "customer.name is required" };
  if (phone.length < 6) return { error: "customer.phone is required" };
  if (address.length < 5) return { error: "customer.address is required" };
  return {
    customer: {
      name,
      phone,
      email,
      address,
    },
  };
}

function normalizeItems(inputItems, products) {
  if (!Array.isArray(inputItems) || inputItems.length === 0) {
    return { error: "items is required (non-empty array)" };
  }

  const normalized = [];
  for (const it of inputItems) {
    const productId = it?.productId;
    const qty = Number(it?.qty || 1);

    if (!productId) return { error: "Each item must have productId" };
    if (!Number.isFinite(qty) || qty < 1) return { error: "qty must be >= 1" };

    const product = products.find((p) => p.id === productId);
    if (!product) return { error: `Unknown productId: ${productId}` };

    normalized.push({
      productId,
      qty,
      name: product.name,
      pack: product.pack,
      price: product.price ?? null,
      currency: product.currency ?? null,
    });
  }

  const canComputeTotal = normalized.every((i) => typeof i.price === "number");
  const total = canComputeTotal
    ? normalized.reduce((sum, i) => sum + i.price * i.qty, 0)
    : null;

  return { normalizedItems: normalized, total, canComputeTotal };
}

function getRazorpayClient() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

function computeRazorpaySignature({ orderId, paymentId }, keySecret) {
  return crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "varsha-ayurveda-shop-api" });
});

// ----- AUTH -----
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    const n = String(name || "").trim();
    const e = String(email || "").trim().toLowerCase();
    const p = String(password || "");

    if (n.length < 2) return res.status(400).json({ error: "name must be at least 2 characters" });
    if (!e.includes("@") || e.length < 6) return res.status(400).json({ error: "valid email is required" });
    if (p.length < 6) return res.status(400).json({ error: "password must be at least 6 characters" });

    const db = await readDb();
    db.users = db.users || [];

    if (db.users.some((u) => String(u.email).toLowerCase() === e)) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(p, 10);

    const user = {
      id: "usr_" + nanoid(10),
      name: n,
      email: e,
      role: "customer",
      passwordHash,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    db.users.unshift(user);
    await writeDb(db);

    const token = signToken(user);
    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch {
    return res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const e = String(email || "").trim().toLowerCase();
    const p = String(password || "");

    if (!e || !p) return res.status(400).json({ error: "email and password are required" });

    const db = await readDb();
    db.users = db.users || [];
    const user = db.users.find((u) => String(u.email).toLowerCase() === e);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(p, user.passwordHash || "");
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch {
    return res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const db = await readDb();
  db.users = db.users || [];
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ user: sanitizeUser(user) });
});

// With JWT auth, logout is handled client-side by deleting the token.
app.post("/api/auth/logout", (_req, res) => {
  return res.json({ ok: true });
});

// ----- PRODUCTS (public) -----
app.get("/api/products", async (req, res) => {
  const { q, category, limit = "50", offset = "0" } = req.query;
  const db = await readDb();

  let items = db.products || [];

  if (category) {
    const cat = String(category).toLowerCase();
    items = items.filter((p) => String(p.category || "").toLowerCase() === cat);
  }

  if (q) {
    const needle = String(q).toLowerCase();
    items = items.filter((p) => {
      const hay = [p.name, p.brand, p.category, p.pack, ...(p.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }

  const lim = Math.max(1, Math.min(200, parseInt(String(limit), 10) || 50));
  const off = Math.max(0, parseInt(String(offset), 10) || 0);
  const paged = items.slice(off, off + lim);

  res.json({ total: items.length, limit: lim, offset: off, items: paged });
});

app.get("/api/products/:id", async (req, res) => {
  const db = await readDb();
  const product = (db.products || []).find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(product);
});

// ----- ORDERS -----
// NOTE: For online payment, use /api/payments/razorpay/* endpoints.
app.post("/api/orders", async (req, res) => {
  const { customer, items, paymentMethod } = req.body || {};

  const cust = sanitizeCustomer(customer);
  if (!cust || cust.error) return res.status(400).json({ error: cust?.error || "customer is required" });

  const db = await readDb();
  const products = db.products || [];

  const norm = normalizeItems(items, products);
  if (norm.error) return res.status(400).json({ error: norm.error });

  const method = String(paymentMethod || "COD").toUpperCase();
  if (method !== "COD") {
    return res.status(400).json({
      error: "For online payments, use /api/payments/razorpay/create-order",
    });
  }

  const order = {
    id: "ord_" + nanoid(10),
    userId: req.user ? req.user.id : null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    status: "PLACED",
    payment: {
      method: "COD",
      status: "UNPAID",
      provider: null,
      providerOrderId: null,
      providerPaymentId: null,
      verifiedAt: null,
    },
    customer: cust.customer,
    items: norm.normalizedItems,
    total: norm.total,
    currency: norm.canComputeTotal ? (norm.normalizedItems[0].currency || "INR") : null,
  };

  db.orders = db.orders || [];
  db.orders.unshift(order);
  await writeDb(db);

  res.status(201).json(order);
});

app.get("/api/orders/:id", async (req, res) => {
  const db = await readDb();
  const order = (db.orders || []).find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Not found" });

  // If the order is linked to a user account, only that user (or admin) can view it.
  if (order.userId) {
    if (isAdminRequest(req)) return res.json(order);
    if (!req.user) return res.status(401).json({ error: "Login required to view this order" });
    if (req.user.id !== order.userId) return res.status(403).json({ error: "Forbidden" });
  }

  res.json(order);
});

app.get("/api/my/orders", requireAuth, async (req, res) => {
  const db = await readDb();
  const items = (db.orders || []).filter((o) => o.userId === req.user.id);
  res.json({ items });
});

// ----- PAYMENT GATEWAY: Razorpay (Standard Checkout) -----
app.post("/api/payments/razorpay/create-order", async (req, res) => {
  const rzp = getRazorpayClient();
  if (!rzp) {
    return res.status(503).json({
      error: "Razorpay is not configured on the server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env",
    });
  }

  const { customer, items } = req.body || {};

  const cust = sanitizeCustomer(customer);
  if (!cust || cust.error) return res.status(400).json({ error: cust?.error || "customer is required" });

  const db = await readDb();
  const products = db.products || [];
  const norm = normalizeItems(items, products);
  if (norm.error) return res.status(400).json({ error: norm.error });

  if (!norm.canComputeTotal || typeof norm.total !== "number" || norm.total <= 0) {
    return res.status(400).json({
      error: "Online payment needs prices for all cart items. Please add prices (admin) or use Cash on Delivery.",
    });
  }

  // Create internal order first, then create Razorpay order and attach IDs.
  const internalOrder = {
    id: "ord_" + nanoid(10),
    userId: req.user ? req.user.id : null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    status: "PENDING_PAYMENT",
    payment: {
      method: "RAZORPAY",
      status: "PENDING",
      provider: "razorpay",
      providerOrderId: null,
      providerPaymentId: null,
      verifiedAt: null,
    },
    customer: cust.customer,
    items: norm.normalizedItems,
    total: norm.total,
    currency: "INR",
  };

  db.orders = db.orders || [];
  db.orders.unshift(internalOrder);
  await writeDb(db);

  // Razorpay expects amount in currency subunits (paise for INR).
  const amountSubunit = Math.round(norm.total * 100);

  try {
    const razorOrder = await rzp.orders.create({
      amount: amountSubunit,
      currency: "INR",
      receipt: internalOrder.id,
      notes: {
        internalOrderId: internalOrder.id,
      },
    });

    // Save Razorpay order id to our internal order
    const db2 = await readDb();
    db2.orders = db2.orders || [];
    const idx = db2.orders.findIndex((o) => o.id === internalOrder.id);
    if (idx !== -1) {
      db2.orders[idx].payment.providerOrderId = razorOrder.id;
      db2.orders[idx].updatedAt = nowIso();
      await writeDb(db2);
    }

    return res.json({
      orderId: internalOrder.id,
      razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: razorOrder.id,
        amount: razorOrder.amount,
        currency: razorOrder.currency,
      },
    });
  } catch (e) {
    // mark internal order failed
    const db3 = await readDb();
    db3.orders = db3.orders || [];
    const idx = db3.orders.findIndex((o) => o.id === internalOrder.id);
    if (idx !== -1) {
      db3.orders[idx].payment.status = "FAILED";
      db3.orders[idx].status = "PAYMENT_FAILED";
      db3.orders[idx].updatedAt = nowIso();
      await writeDb(db3);
    }

    return res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});

app.post("/api/payments/razorpay/verify", async (req, res) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(503).json({
      error: "Razorpay is not configured on the server. Set RAZORPAY_KEY_SECRET in server/.env",
    });
  }

  const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body || {};
  if (!orderId) return res.status(400).json({ error: "orderId is required" });
  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({
      error: "razorpay_payment_id, razorpay_order_id and razorpay_signature are required",
    });
  }

  const db = await readDb();
  db.orders = db.orders || [];
  const idx = db.orders.findIndex((o) => o.id === String(orderId));
  if (idx === -1) return res.status(404).json({ error: "Order not found" });

  const order = db.orders[idx];

  // Access control for user-linked orders
  if (order.userId) {
    if (!isAdminRequest(req) && (!req.user || req.user.id !== order.userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  // Verify signature
  const expected = computeRazorpaySignature(
    { orderId: razorpay_order_id, paymentId: razorpay_payment_id },
    keySecret
  );

  if (expected !== razorpay_signature) {
    order.payment.status = "FAILED";
    order.status = "PAYMENT_FAILED";
    order.updatedAt = nowIso();
    await writeDb(db);
    return res.status(400).json({ error: "Payment verification failed" });
  }

  // Mark paid
  order.payment.status = "PAID";
  order.payment.providerOrderId = razorpay_order_id;
  order.payment.providerPaymentId = razorpay_payment_id;
  order.payment.verifiedAt = nowIso();
  order.status = "PAID";
  order.updatedAt = nowIso();

  await writeDb(db);
  return res.json({ ok: true, order });
});

// ----- ADMIN -----
// Admin via either:
//  - x-admin-key header (ADMIN_KEY)
//  - JWT user.role=admin

app.get("/api/admin/meta", requireAdminAny, async (_req, res) => {
  const db = await readDb();
  res.json({
    meta: db.meta || {},
    counts: {
      products: (db.products || []).length,
      orders: (db.orders || []).length,
      users: (db.users || []).length,
    },
  });
});

app.get("/api/admin/orders", requireAdminAny, async (req, res) => {
  const { q, status } = req.query;
  const db = await readDb();
  let items = db.orders || [];

  if (status) {
    const s = String(status).toUpperCase();
    items = items.filter((o) => String(o.status || "").toUpperCase() === s);
  }

  if (q) {
    const needle = String(q).toLowerCase();
    items = items.filter((o) => {
      const hay = [o.id, o.customer?.name, o.customer?.phone, o.customer?.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }

  res.json({ items });
});

app.get("/api/admin/orders/:id", requireAdminAny, async (req, res) => {
  const db = await readDb();
  const order = (db.orders || []).find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Not found" });
  res.json(order);
});

app.put("/api/admin/orders/:id/status", requireAdminAny, async (req, res) => {
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: "status is required" });

  const db = await readDb();
  db.orders = db.orders || [];
  const idx = db.orders.findIndex((o) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  db.orders[idx].status = String(status).trim().toUpperCase();
  db.orders[idx].updatedAt = nowIso();
  await writeDb(db);
  res.json(db.orders[idx]);
});

app.put("/api/admin/orders/:id/mark-paid", requireAdminAny, async (req, res) => {
  const db = await readDb();
  db.orders = db.orders || [];
  const idx = db.orders.findIndex((o) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  db.orders[idx].payment = db.orders[idx].payment || {};
  db.orders[idx].payment.status = "PAID";
  db.orders[idx].payment.verifiedAt = nowIso();
  if (!db.orders[idx].status || db.orders[idx].status === "PLACED") {
    db.orders[idx].status = "PAID";
  }
  db.orders[idx].updatedAt = nowIso();
  await writeDb(db);
  res.json(db.orders[idx]);
});

app.get("/api/admin/sales/summary", requireAdminAny, async (_req, res) => {
  const db = await readDb();
  const orders = db.orders || [];
  const users = db.users || [];

  const paidOrders = orders.filter((o) => o.payment?.status === "PAID");
  const revenue = paidOrders
    .filter((o) => typeof o.total === "number")
    .reduce((sum, o) => sum + o.total, 0);

  // Aggregate product-wise units & revenue
  const byProduct = new Map();
  for (const o of paidOrders) {
    for (const it of o.items || []) {
      const key = it.productId;
      const prev = byProduct.get(key) || { productId: key, name: it.name, qty: 0, revenue: 0 };
      prev.qty += Number(it.qty || 0);
      if (typeof it.price === "number") prev.revenue += it.price * Number(it.qty || 0);
      byProduct.set(key, prev);
    }
  }

  const topProducts = Array.from(byProduct.values())
    .sort((a, b) => (b.revenue - a.revenue) || (b.qty - a.qty))
    .slice(0, 10);

  res.json({
    counts: {
      ordersTotal: orders.length,
      ordersPaid: paidOrders.length,
      usersTotal: users.length,
    },
    revenue: { currency: "INR", total: revenue },
    topProducts,
    recentOrders: orders.slice(0, 10),
  });
});

// Admin product management (already present in earlier version)
app.post("/api/admin/products", requireAdminAny, async (req, res) => {
  const input = req.body || {};
  if (!input.name || String(input.name).trim().length < 2) {
    return res.status(400).json({ error: "name is required" });
  }

  const db = await readDb();
  db.products = db.products || [];

  const product = {
    id: input.id ? String(input.id) : "prd_" + nanoid(10),
    name: String(input.name).trim(),
    brand: input.brand ? String(input.brand).trim() : "Varsha Ayurveda",
    category: input.category ? String(input.category).trim() : "Other",
    pack: input.pack ? String(input.pack).trim() : "",
    price: input.price === null || input.price === undefined || input.price === "" ? null : Number(input.price),
    currency: input.currency ? String(input.currency) : "INR",
    image: input.image ? String(input.image) : "",
    shortDescription: input.shortDescription ? String(input.shortDescription) : "",
    tags: Array.isArray(input.tags) ? input.tags.map(String) : [],
  };

  if (db.products.some((p) => p.id === product.id)) {
    return res.status(409).json({ error: "Product id already exists" });
  }

  db.products.unshift(product);
  await writeDb(db);
  res.status(201).json(product);
});

app.put("/api/admin/products/:id", requireAdminAny, async (req, res) => {
  const db = await readDb();
  db.products = db.products || [];
  const idx = db.products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const p = db.products[idx];
  const input = req.body || {};
  const updated = { ...p, ...input };

  updated.name = updated.name ? String(updated.name).trim() : p.name;
  updated.brand = updated.brand ? String(updated.brand).trim() : p.brand;
  updated.category = updated.category ? String(updated.category).trim() : p.category;
  updated.pack = updated.pack ? String(updated.pack).trim() : p.pack;
  updated.image = updated.image ? String(updated.image) : p.image;
  updated.shortDescription = updated.shortDescription ? String(updated.shortDescription) : p.shortDescription;
  updated.tags = Array.isArray(updated.tags) ? updated.tags.map(String) : p.tags || [];
  updated.price = updated.price === null || updated.price === undefined || updated.price === "" ? null : Number(updated.price);
  updated.currency = updated.currency ? String(updated.currency) : (p.currency || "INR");

  db.products[idx] = updated;
  await writeDb(db);
  res.json(updated);
});

app.delete("/api/admin/products/:id", requireAdminAny, async (req, res) => {
  const db = await readDb();
  db.products = db.products || [];
  const before = db.products.length;
  db.products = db.products.filter((p) => p.id !== req.params.id);
  if (db.products.length === before) return res.status(404).json({ error: "Not found" });
  await writeDb(db);
  res.json({ ok: true });
});


// ----- ERROR HANDLER -----
// Return JSON instead of Express HTML error pages (so the React UI won't render huge stacks)
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  await ensureAdminUser();
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

start().catch((e) => {
  console.error("Failed to start server", e);
  process.exit(1);
});
