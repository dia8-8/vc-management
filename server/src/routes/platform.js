const express = require("express");
const { z } = require("zod");
const { prismaRaw } = require("../lib/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { licenseFor } = require("../lib/license");

const router = express.Router();
router.use(requireAuth, requireRole("SUPER_ADMIN"));

async function serialize(tenant) {
  const admin = await prismaRaw.user.findFirst({
    where: { tenantId: tenant.id, role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { name: true, email: true },
  });
  return {
    id: tenant.id,
    name: tenant.name,
    createdAt: tenant.createdAt,
    owner: admin,
    userCount: tenant._count?.users ?? 0,
    orderCount: tenant._count?.orders ?? 0,
    license: licenseFor(tenant),
  };
}

router.get("/tenants", async (req, res) => {
  const tenants = await prismaRaw.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, orders: true } } },
  });
  res.json(await Promise.all(tenants.map(serialize)));
});

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  plan: z.enum(["TRIAL", "BASIC", "PRO"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  maxUsers: z.coerce.number().int().min(1).max(1000).optional(),
  // yyyy-mm-dd, or null for "never expires"
  expiresAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  // Convenience: push expiry forward by N days from the later of now / current expiry
  extendDays: z.coerce.number().int().min(1).max(3650).optional(),
});

router.patch("/tenants/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const tenant = await prismaRaw.tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) return res.status(404).json({ error: "Client not found" });

  const { extendDays, expiresAt, ...rest } = parsed.data;
  const data = { ...rest };

  if (extendDays) {
    const base = tenant.expiresAt && tenant.expiresAt.getTime() > Date.now() ? tenant.expiresAt.getTime() : Date.now();
    data.expiresAt = new Date(base + extendDays * 86400000);
  } else if (expiresAt !== undefined) {
    // End of the chosen day, so "expires 2026-12-31" still works all day on the 31st
    data.expiresAt = expiresAt === null ? null : new Date(`${expiresAt}T23:59:59.999Z`);
  }

  const updated = await prismaRaw.tenant.update({
    where: { id: tenant.id },
    data,
    include: { _count: { select: { users: true, orders: true } } },
  });
  res.json(await serialize(updated));
});

module.exports = router;
