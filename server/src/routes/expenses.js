const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");
const { logActivity } = require("../lib/activityLog");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const { category, from, to } = req.query;
  const where = {};
  if (category) where.category = String(category);
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(String(from));
    if (to) where.date.lte = new Date(String(to));
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  res.json(expenses);
});

const expenseSchema = z.object({
  date: z.coerce.date(),
  category: z.enum(["FUEL", "RENT", "SALARIES", "UTILITIES", "OTHER"]),
  amount: z.coerce.number().positive(),
  note: z.string().optional().nullable(),
});

router.post("/", requireRole("ADMIN", "STAFF"), async (req, res) => {
  const parsed = expenseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const expense = await prisma.expense.create({
    data: { ...parsed.data, createdById: req.user.id },
  });

  await logActivity({ userId: req.user.id, action: "CREATE", entityType: "Expense", entityId: expense.id, details: parsed.data });
  res.status(201).json(expense);
});

router.patch("/:id", requireRole("ADMIN", "STAFF"), async (req, res) => {
  const parsed = expenseSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const expense = await prisma.expense.update({
    where: { id: req.params.id },
    data: parsed.data,
  });

  await logActivity({ userId: req.user.id, action: "UPDATE", entityType: "Expense", entityId: expense.id, details: parsed.data });
  res.json(expense);
});

router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  await prisma.expense.delete({ where: { id: req.params.id } });
  await logActivity({ userId: req.user.id, action: "DELETE", entityType: "Expense", entityId: req.params.id });
  res.status(204).end();
});

module.exports = router;
