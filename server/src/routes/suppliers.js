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
          { contactPerson: { contains: String(search), mode: "insensitive" } },
          { phone: { contains: String(search), mode: "insensitive" } },
        ],
      }
    : {};

  const suppliers = await prisma.supplier.findMany({
    where,
    orderBy: { name: "asc" },
    include: { products: { select: { id: true } } },
  });

  const withCounts = suppliers.map((s) => {
    const { products, ...rest } = s;
    return { ...rest, productCount: products.length };
  });

  res.json(withCounts);
});

router.get("/:id", async (req, res) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id: req.params.id },
    include: {
      products: { select: { id: true, name: true, unit: true, stockQty: true } },
      stockMovements: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { product: { select: { id: true, name: true } } },
      },
    },
  });
  if (!supplier) return res.status(404).json({ error: "Supplier not found" });
  res.json(supplier);
});

const supplierSchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

router.post("/", async (req, res) => {
  const parsed = supplierSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const supplier = await prisma.supplier.create({ data: parsed.data });

  await logActivity({ userId: req.user.id, action: "CREATE", entityType: "Supplier", entityId: supplier.id, details: parsed.data });
  res.status(201).json(supplier);
});

router.patch("/:id", async (req, res) => {
  const parsed = supplierSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const supplier = await prisma.supplier.update({
    where: { id: req.params.id },
    data: parsed.data,
  });

  await logActivity({ userId: req.user.id, action: "UPDATE", entityType: "Supplier", entityId: supplier.id, details: parsed.data });
  res.json(supplier);
});

router.delete("/:id", async (req, res) => {
  await prisma.supplier.delete({ where: { id: req.params.id } });
  await logActivity({ userId: req.user.id, action: "DELETE", entityType: "Supplier", entityId: req.params.id });
  res.status(204).end();
});

module.exports = router;
