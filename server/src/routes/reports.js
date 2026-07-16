const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireRole("ADMIN", "STAFF"));

function parseRange(req) {
  const { from, to } = req.query;
  const start = from ? new Date(String(from)) : new Date(new Date().setDate(new Date().getDate() - 29));
  if (!from) start.setHours(0, 0, 0, 0);
  const end = to ? new Date(String(to)) : new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

router.get("/summary", async (req, res) => {
  const { start, end } = parseRange(req);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end }, status: { not: "CANCELLED" } },
    include: { items: { include: { product: true } } },
  });

  const totalSales = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalCost = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + Number(i.product.costPrice) * Number(i.quantity), 0),
    0
  );
  const grossProfit = totalSales - totalCost;

  const expenseAgg = await prisma.expense.aggregate({
    where: { date: { gte: start, lte: end } },
    _sum: { amount: true },
  });
  const totalExpenses = Number(expenseAgg._sum.amount || 0);
  const netProfit = grossProfit - totalExpenses;

  res.json({
    orderCount: orders.length,
    totalSales,
    totalCost,
    grossProfit,
    totalExpenses,
    netProfit,
  });
});

function localDateKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

router.get("/trend", async (req, res) => {
  const { start, end } = parseRange(req);

  const [orders, expenses] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end }, status: { not: "CANCELLED" } },
      include: { items: { include: { product: true } } },
    }),
    prisma.expense.findMany({ where: { date: { gte: start, lte: end } } }),
  ]);

  const dailyMap = new Map();
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);
  while (cursor <= endDay) {
    const key = localDateKey(cursor);
    dailyMap.set(key, { date: key, sales: 0, expenses: 0, profit: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const o of orders) {
    const key = localDateKey(o.createdAt);
    const bucket = dailyMap.get(key);
    if (!bucket) continue;
    const cost = o.items.reduce((s, i) => s + Number(i.product.costPrice) * Number(i.quantity), 0);
    bucket.sales += Number(o.total);
    bucket.profit += Number(o.total) - cost;
  }
  for (const e of expenses) {
    const key = localDateKey(e.date);
    const bucket = dailyMap.get(key);
    if (!bucket) continue;
    bucket.expenses += Number(e.amount);
    bucket.profit -= Number(e.amount);
  }

  res.json({ trend: Array.from(dailyMap.values()) });
});

router.get("/top-products", async (req, res) => {
  const { start, end } = parseRange(req);
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end }, status: { not: "CANCELLED" } },
    include: { items: { include: { product: true } } },
  });

  const map = new Map();
  for (const o of orders) {
    for (const item of o.items) {
      const key = item.productId;
      const entry = map.get(key) || { name: item.product.name, quantity: 0, revenue: 0 };
      entry.quantity += Number(item.quantity);
      entry.revenue += Number(item.unitPrice) * Number(item.quantity);
      map.set(key, entry);
    }
  }

  const topProducts = Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);

  res.json(topProducts);
});

router.get("/top-customers", async (req, res) => {
  const { start, end } = parseRange(req);
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end }, status: { not: "CANCELLED" } },
    include: { customer: { select: { id: true, name: true } } },
  });

  const map = new Map();
  for (const o of orders) {
    const key = o.customerId;
    const entry = map.get(key) || { name: o.customer.name, orderCount: 0, total: 0 };
    entry.orderCount += 1;
    entry.total += Number(o.total);
    map.set(key, entry);
  }

  const topCustomers = Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  res.json(topCustomers);
});

module.exports = router;
