const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireRole("ADMIN"));

router.get("/", async (req, res) => {
  const { entityType, userId, from, to, limit, offset } = req.query;
  const where = {};
  if (entityType) where.entityType = String(entityType);
  if (userId) where.userId = String(userId);
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(String(from));
    if (to) where.createdAt.lte = new Date(String(to));
  }

  const take = Math.min(Number(limit) || 50, 200);
  const skip = Number(offset) || 0;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.activityLog.count({ where }),
  ]);

  res.json({ logs, total });
});

module.exports = router;
