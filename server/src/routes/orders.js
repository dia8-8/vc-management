const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { logActivity } = require("../lib/activityLog");

const router = express.Router();
router.use(requireAuth);

router.get("/drivers", requireRole("ADMIN", "STAFF"), async (req, res) => {
  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER", active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  res.json(drivers);
});

function buildOrderWhere(req, { includeStatus = true, includePayment = true } = {}) {
  const { status, customerId, search, paymentStatus } = req.query;
  const where = {
    ...(includeStatus && status ? { status: String(status) } : {}),
    ...(customerId ? { customerId: String(customerId) } : {}),
    ...(req.user.role === "DRIVER" ? { assignedDriverId: req.user.id } : {}),
  };
  if (includePayment) {
    if (paymentStatus === "UNPAID") where.paymentStatus = { not: "PAID" };
    else if (paymentStatus) where.paymentStatus = String(paymentStatus);
  }
  if (search) {
    where.OR = [
      { orderNumber: { contains: String(search), mode: "insensitive" } },
      { customer: { name: { contains: String(search), mode: "insensitive" } } },
    ];
  }
  return where;
}

router.get("/status-counts", async (req, res) => {
  const statusWhere = buildOrderWhere(req, { includeStatus: false, includePayment: true });
  const grouped = await prisma.order.groupBy({ by: ["status"], where: statusWhere, _count: { _all: true } });
  const counts = {};
  let total = 0;
  for (const g of grouped) {
    counts[g.status] = g._count._all;
    total += g._count._all;
  }

  const paymentWhere = buildOrderWhere(req, { includeStatus: true, includePayment: false });
  const groupedPayment = await prisma.order.groupBy({ by: ["paymentStatus"], where: paymentWhere, _count: { _all: true } });
  const paymentCounts = { UNPAID: 0, PARTIAL: 0, PAID: 0 };
  for (const g of groupedPayment) {
    paymentCounts[g.paymentStatus] = g._count._all;
  }

  res.json({ counts, total, paymentCounts });
});

router.get("/", async (req, res) => {
  const { limit, offset } = req.query;
  const where = buildOrderWhere(req, { includeStatus: true });
  const orders = await prisma.order.findMany({
    where,
    include: { customer: true, items: { include: { product: true } }, assignedDriver: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    ...(limit ? { take: Math.min(Number(limit), 200), skip: Number(offset) || 0 } : {}),
  });
  res.json(orders);
});

router.get("/:id", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      customer: true,
      items: { include: { product: true } },
      createdBy: { select: { id: true, name: true } },
      assignedDriver: { select: { id: true, name: true } },
      payments: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { id: true, name: true } } } },
    },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (req.user.role === "DRIVER" && order.assignedDriverId !== req.user.id) {
    return res.status(403).json({ error: "Not assigned to this order" });
  }
  res.json(order);
});

const createSchema = z.object({
  customerId: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().positive(),
        unitPrice: z.coerce.number().nonnegative().optional(),
      })
    )
    .min(1),
  discount: z.coerce.number().nonnegative().default(0),
  deliveryFee: z.coerce.number().nonnegative().default(0),
  notes: z.string().optional().nullable(),
});

// Stock is deducted immediately when an order is created (not cancelled), since a small
// distributor needs to prevent overselling against on-hand inventory rather than only
// at delivery time. Cancelling an order restocks it.
router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { customerId, items, discount, deliveryFee, notes } = parsed.data;

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) return res.status(404).json({ error: `Product ${item.productId} not found` });
    if (Number(product.stockQty) < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${product.name} (have ${product.stockQty}, need ${item.quantity})` });
    }
  }

  const lineItems = items.map((item) => {
    const product = productMap.get(item.productId);
    const unitPrice = item.unitPrice !== undefined ? item.unitPrice : Number(product.sellingPrice);
    const lineTotal = unitPrice * item.quantity;
    return { productId: item.productId, quantity: item.quantity, unitPrice, lineTotal };
  });

  const subtotal = lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
  const total = Math.max(0, subtotal - discount) + deliveryFee;

  const settings = await prisma.setting.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } });
  const orderCount = await prisma.order.count();
  const orderNumber = `${settings.invoicePrefix}-${String(orderCount + 1).padStart(4, "0")}`;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        customerId,
        discount,
        deliveryFee,
        subtotal,
        total,
        notes,
        createdById: req.user.id,
        items: { create: lineItems },
      },
      include: { items: { include: { product: true } }, customer: true },
    });

    for (const li of lineItems) {
      await tx.product.update({
        where: { id: li.productId },
        data: { stockQty: { decrement: li.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: li.productId,
          type: "OUT",
          quantity: -li.quantity,
          reason: `Order ${orderNumber}`,
          orderId: created.id,
          createdById: req.user.id,
        },
      });
    }

    return created;
  });

  await logActivity({ userId: req.user.id, action: "CREATE", entityType: "Order", entityId: order.id, details: { orderNumber, total } });
  res.status(201).json(order);
});

// Only PENDING orders can be edited: once an order moves to PREPARING or beyond, staff are
// acting on the original items, so changing them silently could hide the actual work in progress.
router.patch("/:id", requireRole("ADMIN", "STAFF"), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { customerId, items, discount, deliveryFee, notes } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status !== "PENDING") return res.status(400).json({ error: "Only pending orders can be edited" });

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  const newProductIds = items.map((i) => i.productId);
  const oldProductIds = order.items.map((i) => i.productId);
  const allProductIds = Array.from(new Set([...newProductIds, ...oldProductIds]));
  const products = await prisma.product.findMany({ where: { id: { in: allProductIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    if (!productMap.get(item.productId)) return res.status(404).json({ error: `Product ${item.productId} not found` });
  }

  // Check availability as if the order's original items were first returned to stock.
  const availability = new Map(products.map((p) => [p.id, Number(p.stockQty)]));
  for (const oldItem of order.items) {
    availability.set(oldItem.productId, (availability.get(oldItem.productId) || 0) + Number(oldItem.quantity));
  }
  for (const item of items) {
    const avail = availability.get(item.productId) || 0;
    if (avail < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${productMap.get(item.productId).name} (have ${avail}, need ${item.quantity})` });
    }
    availability.set(item.productId, avail - item.quantity);
  }

  const lineItems = items.map((item) => {
    const product = productMap.get(item.productId);
    const unitPrice = item.unitPrice !== undefined ? item.unitPrice : Number(product.sellingPrice);
    const lineTotal = unitPrice * item.quantity;
    return { productId: item.productId, quantity: item.quantity, unitPrice, lineTotal };
  });
  const subtotal = lineItems.reduce((sum, li) => sum + li.lineTotal, 0);
  const total = Math.max(0, subtotal - discount) + deliveryFee;

  const updated = await prisma.$transaction(async (tx) => {
    for (const oldItem of order.items) {
      await tx.product.update({ where: { id: oldItem.productId }, data: { stockQty: { increment: Number(oldItem.quantity) } } });
      await tx.stockMovement.create({
        data: {
          productId: oldItem.productId,
          type: "ADJUSTMENT",
          quantity: Number(oldItem.quantity),
          reason: `Order ${order.orderNumber} edited (restock)`,
          orderId: order.id,
          createdById: req.user.id,
        },
      });
    }

    await tx.orderItem.deleteMany({ where: { orderId: order.id } });

    const result = await tx.order.update({
      where: { id: order.id },
      data: { customerId, discount, deliveryFee, subtotal, total, notes, items: { create: lineItems } },
      include: { items: { include: { product: true } }, customer: true },
    });

    for (const li of lineItems) {
      await tx.product.update({ where: { id: li.productId }, data: { stockQty: { decrement: li.quantity } } });
      await tx.stockMovement.create({
        data: {
          productId: li.productId,
          type: "OUT",
          quantity: -li.quantity,
          reason: `Order ${order.orderNumber} edited`,
          orderId: order.id,
          createdById: req.user.id,
        },
      });
    }

    return result;
  });

  await logActivity({ userId: req.user.id, action: "UPDATE", entityType: "Order", entityId: order.id, details: { orderNumber: order.orderNumber, total } });
  res.json(updated);
});

const statusSchema = z.object({
  status: z.enum(["PENDING", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
  deliveryNotes: z.string().optional().nullable(),
});

router.patch("/:id/status", async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { status, deliveryNotes } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (req.user.role === "DRIVER") {
    if (order.assignedDriverId !== req.user.id) {
      return res.status(403).json({ error: "Not assigned to this order" });
    }
    if (!["OUT_FOR_DELIVERY", "DELIVERED"].includes(status)) {
      return res.status(403).json({ error: "Drivers can only mark orders out for delivery or delivered" });
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (status === "CANCELLED" && order.status !== "CANCELLED") {
      for (const item of order.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stockQty: { increment: Number(item.quantity) } } });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "IN",
            quantity: Number(item.quantity),
            reason: `Order ${order.orderNumber} cancelled`,
            orderId: order.id,
            createdById: req.user.id,
          },
        });
      }
    }
    return tx.order.update({
      where: { id: order.id },
      data: { status, ...(deliveryNotes !== undefined ? { deliveryNotes } : {}) },
      include: { customer: true, items: true, assignedDriver: { select: { id: true, name: true } } },
    });
  });

  await logActivity({ userId: req.user.id, action: "UPDATE", entityType: "Order", entityId: order.id, details: { status } });
  res.json(updated);
});

const assignDriverSchema = z.object({
  assignedDriverId: z.string().nullable(),
});

router.patch("/:id/assign-driver", requireRole("ADMIN", "STAFF"), async (req, res) => {
  const parsed = assignDriverSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { assignedDriverId } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (assignedDriverId) {
    const driver = await prisma.user.findUnique({ where: { id: assignedDriverId } });
    if (!driver || driver.role !== "DRIVER" || !driver.active) {
      return res.status(400).json({ error: "Target user is not an active driver" });
    }
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { assignedDriverId },
    include: { customer: true, items: true, assignedDriver: { select: { id: true, name: true } } },
  });

  await logActivity({ userId: req.user.id, action: "UPDATE", entityType: "Order", entityId: order.id, details: { assignedDriverId } });
  res.json(updated);
});

const paymentSchema = z.object({
  amount: z.coerce.number().positive(),
  note: z.string().optional().nullable(),
});

router.post("/:id/payments", requireRole("ADMIN", "STAFF"), async (req, res) => {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status === "CANCELLED") return res.status(400).json({ error: "Cannot record a payment on a cancelled order" });
  if (order.paymentStatus === "PAID") return res.status(400).json({ error: "Order is already fully paid" });

  const { amount, note } = parsed.data;
  const amountPaid = Number(order.amountPaid) + amount;
  const paymentStatus = amountPaid <= 0 ? "UNPAID" : amountPaid >= Number(order.total) ? "PAID" : "PARTIAL";

  const updated = await prisma.$transaction(async (tx) => {
    await tx.payment.create({ data: { orderId: order.id, amount, note, createdById: req.user.id } });
    return tx.order.update({
      where: { id: order.id },
      data: { amountPaid, paymentStatus },
      include: {
        customer: true,
        payments: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { id: true, name: true } } } },
      },
    });
  });

  await logActivity({ userId: req.user.id, action: "CREATE", entityType: "Payment", entityId: order.id, details: { amount, amountPaid, paymentStatus } });
  res.json(updated);
});

module.exports = router;
