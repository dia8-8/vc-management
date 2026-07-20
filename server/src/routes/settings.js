const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { logActivity } = require("../lib/activityLog");

const router = express.Router();
router.use(requireAuth);

async function getOrCreateSettings() {
  return prisma.setting.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

router.get("/", async (req, res) => {
  const settings = await getOrCreateSettings();
  res.json(settings);
});

const settingsSchema = z.object({
  companyName: z.string().min(1),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  invoicePrefix: z.string().min(1),
  currency: z.string().min(1),
  defaultLowStockThreshold: z.coerce.number().nonnegative(),
  taxRate: z.coerce.number().min(0).max(1),
  variableWeightEnabled: z.boolean().optional(),
  variableWeightPrefix: z.string().optional(),
  variableWeightItemStart: z.coerce.number().int().min(0).optional(),
  variableWeightItemLength: z.coerce.number().int().min(1).optional(),
  variableWeightWeightStart: z.coerce.number().int().min(0).optional(),
  variableWeightWeightLength: z.coerce.number().int().min(1).optional(),
  variableWeightDecimals: z.coerce.number().int().min(0).max(6).optional(),
  variableWeightUnit: z.string().optional(),
});

router.patch("/", requireRole("ADMIN"), async (req, res) => {
  const parsed = settingsSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  await getOrCreateSettings();
  const settings = await prisma.setting.update({
    where: { id: "singleton" },
    data: parsed.data,
  });

  await logActivity({ userId: req.user.id, action: "UPDATE", entityType: "Setting", entityId: settings.id, details: parsed.data });
  res.json(settings);
});

module.exports = router;
