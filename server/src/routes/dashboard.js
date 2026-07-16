const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todaysOrders = await prisma.order.findMany({
    where: { createdAt: { gte: startOfDay, lte: endOfDay }, status: { not: "CANCELLED" } },
    include: { items: { include: { product: true } } },
  });

  const totalSalesToday = todaysOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const profitToday = todaysOrders.reduce((sum, o) => {
    const cost = o.items.reduce((s, i) => s + Number(i.product.costPrice) * Number(i.quantity), 0);
    return sum + (Number(o.total) - cost);
  }, 0);

  const pendingOrders = await prisma.order.count({ where: { status: { in: ["PENDING", "PREPARING"] } } });
  const completedDeliveriesToday = await prisma.order.count({
    where: { status: "DELIVERED", updatedAt: { gte: startOfDay, lte: endOfDay } },
  });

  const unpaidOrders = await prisma.order.findMany({
    where: { paymentStatus: { in: ["UNPAID", "PARTIAL"] }, status: { not: "CANCELLED" } },
    select: { total: true, amountPaid: true },
  });
  const unpaidInvoicesTotal = unpaidOrders.reduce((sum, o) => sum + (Number(o.total) - Number(o.amountPaid)), 0);

  const products = await prisma.product.findMany({ where: { active: true } });
  const lowStockProducts = products.filter((p) => Number(p.stockQty) <= Number(p.lowStockThreshold));

  res.json({
    totalSalesToday,
    profitToday,
    pendingOrders,
    completedDeliveriesToday,
    unpaidInvoicesCount: unpaidOrders.length,
    unpaidInvoicesTotal,
    lowStockCount: lowStockProducts.length,
    lowStockProducts: lowStockProducts.slice(0, 10),
  });
});

function localDateKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

router.get("/trends", async (req, res) => {
  const days = 14;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start }, status: { not: "CANCELLED" } },
    include: { items: { include: { product: true } } },
  });

  const dailyMap = new Map();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = localDateKey(d);
    dailyMap.set(key, { date: key, sales: 0, orders: 0 });
  }
  for (const o of orders) {
    const key = localDateKey(o.createdAt);
    const bucket = dailyMap.get(key);
    if (bucket) {
      bucket.sales += Number(o.total);
      bucket.orders += 1;
    }
  }
  const salesTrend = Array.from(dailyMap.values());

  const statusCounts = await prisma.order.groupBy({ by: ["status"], _count: { _all: true } });
  const statusBreakdown = statusCounts.map((s) => ({ status: s.status, count: s._count._all }));

  const productRevenue = new Map();
  for (const o of orders) {
    for (const item of o.items) {
      const key = item.product.name;
      const revenue = Number(item.unitPrice) * Number(item.quantity);
      productRevenue.set(key, (productRevenue.get(key) || 0) + revenue);
    }
  }
  const topProducts = Array.from(productRevenue.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  res.json({ salesTrend, statusBreakdown, topProducts });
});

module.exports = router;
