const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { logActivity } = require("../lib/activityLog");

const router = express.Router();
router.use(requireAuth);

function buildProductWhere(req) {
  const { search, category } = req.query;
  return {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: String(search), mode: "insensitive" } },
              { category: { contains: String(search), mode: "insensitive" } },
            ],
          }
        : {},
      category ? { category: String(category) } : {},
    ],
  };
}

router.get("/count", async (req, res) => {
  const total = await prisma.product.count({ where: buildProductWhere(req) });
  res.json({ total });
});

router.get("/by-barcode/:code", async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { barcode: req.params.code },
    include: { supplier: { select: { id: true, name: true } } },
  });
  if (!product) return res.status(404).json({ error: "No product with that barcode" });
  res.json(product);
});

router.get("/", async (req, res) => {
  const { lowStock, limit, offset } = req.query;
  const where = buildProductWhere(req);

  let products = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
    include: { supplier: { select: { id: true, name: true } } },
    ...(limit && lowStock !== "true" ? { take: Math.min(Number(limit), 200), skip: Number(offset) || 0 } : {}),
  });

  if (lowStock === "true") {
    products = products.filter((p) => Number(p.stockQty) <= Number(p.lowStockThreshold));
  }

  res.json(products);
});

const productSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  unit: z.enum(["KG", "BOX", "PIECE", "BAG", "CARTON"]),
  costPrice: z.coerce.number().nonnegative(),
  sellingPrice: z.coerce.number().nonnegative(),
  stockQty: z.coerce.number().nonnegative().optional(),
  lowStockThreshold: z.coerce.number().nonnegative().optional(),
  active: z.boolean().optional(),
  supplierId: z.string().optional().nullable(),
  barcode: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? v.trim() : null))
    .transform((v) => v || null),
});

router.post("/", requireRole("ADMIN", "STAFF"), async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  try {
    const product = await prisma.product.create({ data: parsed.data });
    await logActivity({ userId: req.user.id, action: "CREATE", entityType: "Product", entityId: product.id, details: parsed.data });
    res.status(201).json(product);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "That barcode is already assigned to another product" });
    console.error("Create product error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.patch("/:id", requireRole("ADMIN", "STAFF"), async (req, res) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data: parsed.data });
    await logActivity({ userId: req.user.id, action: "UPDATE", entityType: "Product", entityId: product.id, details: parsed.data });
    res.json(product);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "That barcode is already assigned to another product" });
    console.error("Update product error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  await logActivity({ userId: req.user.id, action: "DELETE", entityType: "Product", entityId: req.params.id });
  res.status(204).end();
});

module.exports = router;
