const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { logActivity } = require("../lib/activityLog");

const router = express.Router();
router.use(requireAuth);

router.get("/movements", async (req, res) => {
  const { productId } = req.query;
  const movements = await prisma.stockMovement.findMany({
    where: productId ? { productId: String(productId) } : {},
    include: {
      product: true,
      createdBy: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
      order: { select: { id: true, orderNumber: true, customer: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(movements);
});

const movementSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(["IN", "ADJUSTMENT", "WASTE"]),
  quantity: z.coerce.number(),
  reason: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
});

// Records incoming stock, adjustments, or waste. Outgoing stock from orders is handled in orders.js.
router.post("/movements", requireRole("ADMIN", "STAFF"), async (req, res) => {
  const parsed = movementSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { productId, type, quantity, reason, supplierId } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ error: "Product not found" });

  // IN increases stock. ADJUSTMENT sets a delta (can be +/-). WASTE always decreases stock.
  let delta;
  if (type === "IN") delta = Math.abs(quantity);
  else if (type === "WASTE") delta = -Math.abs(quantity);
  else delta = quantity;

  const newQty = Number(product.stockQty) + delta;
  if (newQty < 0) {
    return res.status(400).json({ error: "Resulting stock cannot be negative" });
  }

  const [movement] = await prisma.$transaction([
    prisma.stockMovement.create({
      data: { productId, type, quantity: delta, reason, createdById: req.user.id, supplierId: type === "IN" ? supplierId : undefined },
    }),
    prisma.product.update({ where: { id: productId }, data: { stockQty: newQty } }),
  ]);

  await logActivity({
    userId: req.user.id,
    action: "STOCK_MOVEMENT",
    entityType: "Product",
    entityId: productId,
    details: { type, quantity: delta, reason },
  });

  res.status(201).json(movement);
});

module.exports = router;
