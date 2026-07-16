const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");
const { logActivity } = require("../lib/activityLog");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const { search } = req.query;
  const where = search
    ? {
        OR: [
          { name: { contains: String(search), mode: "insensitive" } },
          { businessName: { contains: String(search), mode: "insensitive" } },
          { phone: { contains: String(search), mode: "insensitive" } },
        ],
      }
    : {};

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { name: "asc" },
    include: { orders: { select: { id: true, total: true, amountPaid: true, paymentStatus: true } } },
  });

  const withBalance = customers.map((c) => {
    const unpaidBalance = c.orders.reduce((sum, o) => {
      if (o.paymentStatus === "PAID") return sum;
      return sum + (Number(o.total) - Number(o.amountPaid));
    }, 0);
    const { orders, ...rest } = c;
    return { ...rest, orderCount: orders.length, unpaidBalance };
  });

  res.json(withBalance);
});

router.get("/:id", async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: true } } },
      },
    },
  });
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json(customer);
});

const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  businessName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

router.post("/", async (req, res) => {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const customer = await prisma.customer.create({
    data: { ...parsed.data, createdById: req.user.id },
  });

  await logActivity({ userId: req.user.id, action: "CREATE", entityType: "Customer", entityId: customer.id, details: parsed.data });
  res.status(201).json(customer);
});

router.patch("/:id", async (req, res) => {
  const parsed = customerSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: parsed.data,
  });

  await logActivity({ userId: req.user.id, action: "UPDATE", entityType: "Customer", entityId: customer.id, details: parsed.data });
  res.json(customer);
});

router.delete("/:id", async (req, res) => {
  await prisma.customer.delete({ where: { id: req.params.id } });
  await logActivity({ userId: req.user.id, action: "DELETE", entityType: "Customer", entityId: req.params.id });
  res.status(204).end();
});

router.get("/:id/prices", async (req, res) => {
  const prices = await prisma.customerPrice.findMany({
    where: { customerId: req.params.id },
    include: { product: { select: { id: true, name: true, unit: true, sellingPrice: true } } },
  });
  res.json(prices);
});

const customerPriceSchema = z.object({
  unitPrice: z.coerce.number().nonnegative(),
});

router.put("/:id/prices/:productId", async (req, res) => {
  const parsed = customerPriceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const price = await prisma.customerPrice.upsert({
    where: { customerId_productId: { customerId: req.params.id, productId: req.params.productId } },
    update: { unitPrice: parsed.data.unitPrice },
    create: { customerId: req.params.id, productId: req.params.productId, unitPrice: parsed.data.unitPrice },
    include: { product: { select: { id: true, name: true, unit: true, sellingPrice: true } } },
  });

  await logActivity({ userId: req.user.id, action: "UPDATE", entityType: "CustomerPrice", entityId: price.id, details: parsed.data });
  res.json(price);
});

router.delete("/:id/prices/:productId", async (req, res) => {
  await prisma.customerPrice.deleteMany({ where: { customerId: req.params.id, productId: req.params.productId } });
  await logActivity({ userId: req.user.id, action: "DELETE", entityType: "CustomerPrice", entityId: `${req.params.id}:${req.params.productId}` });
  res.status(204).end();
});

module.exports = router;
