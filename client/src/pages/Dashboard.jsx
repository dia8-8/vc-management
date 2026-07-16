import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useTheme } from "../context/ThemeContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const STATUS_LABELS = {
  PENDING: "Pending",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};
const STATUS_COLOR_HEX = {
  PENDING: "#6b7280",
  PREPARING: "#f59e0b",
  OUT_FOR_DELIVERY: "#3b82f6",
  DELIVERED: "#16a34a",
  CANCELLED: "#b91c1c",
};

function money(n) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n || 0);
}

function StatCard({ label, value, tone = "default", to }) {
  const tones = {
    default: "text-gray-900 dark:text-gray-100",
    good: "text-green-600 dark:text-green-400",
    bad: "text-red-600 dark:text-red-400",
    warn: "text-amber-600 dark:text-amber-400",
  };
  const content = (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm h-full">
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${tones[tone]}`}>{value}</div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridStroke = isDark ? "#374151" : "#f3f4f6";
  const tickStyle = { fontSize: 11, fill: isDark ? "#9ca3af" : "#6b7280" };
  const tooltipStyle = isDark ? { backgroundColor: "#1f2937", border: "1px solid #374151", color: "#f3f4f6" } : undefined;
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard")
      .then(({ data }) => setData(data))
      .catch(() => setError("Could not load dashboard"));
    api.get("/dashboard/trends").then(({ data }) => setTrends(data));
  }, []);

  if (error) return <div className="text-red-600 dark:text-red-400">{error}</div>;
  if (!data) return <div className="text-gray-500 dark:text-gray-400">Loading…</div>;

  const salesTrend = (trends?.salesTrend || []).map((d) => {
    const [y, m, day] = d.date.split("-").map(Number);
    return {
      ...d,
      label: new Date(y, m - 1, day).toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
    };
  });
  const statusBreakdown = (trends?.statusBreakdown || []).map((s) => ({
    ...s,
    label: STATUS_LABELS[s.status] || s.status,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Today's overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Sales Today" value={money(data.totalSalesToday)} to="/orders" />
        <StatCard
          label="Profit Today"
          value={money(data.profitToday)}
          tone={data.profitToday >= 0 ? "good" : "bad"}
        />
        <StatCard label="Pending Orders" value={data.pendingOrders} to="/orders" />
        <StatCard label="Delivered Today" value={data.completedDeliveriesToday} tone="good" />
        <StatCard
          label="Unpaid Invoices"
          value={`${data.unpaidInvoicesCount} · ${money(data.unpaidInvoicesTotal)}`}
          tone={data.unpaidInvoicesCount > 0 ? "warn" : "default"}
          to="/orders?paymentStatus=UNPAID"
        />
        <StatCard
          label="Low Stock Items"
          value={data.lowStockCount}
          tone={data.lowStockCount > 0 ? "bad" : "good"}
          to="/inventory"
        />
      </div>

      {data.lowStockProducts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-3 dark:text-gray-100">Low Stock Alerts</h2>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {data.lowStockProducts.map((p) => (
              <div key={p.id} className="py-2 flex justify-between text-sm dark:text-gray-200">
                <span>{p.name}</span>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {p.stockQty} {p.unit.toLowerCase()} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {trends && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-3 dark:text-gray-100">Sales — last 14 days</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b91c1c" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#b91c1c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="label" tick={tickStyle} />
                <YAxis tick={tickStyle} width={40} />
                <Tooltip formatter={(v) => money(v)} contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="sales" stroke="#b91c1c" fill="url(#salesFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-3 dark:text-gray-100">Order Status Breakdown</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusBreakdown} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} label={(d) => d.label}>
                  {statusBreakdown.map((s, i) => (
                    <Cell key={i} fill={STATUS_COLOR_HEX[s.status] || "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-semibold mb-3 dark:text-gray-100">Top Products by Revenue (last 14 days)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trends.topProducts} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis type="number" tick={tickStyle} />
                <YAxis type="category" dataKey="name" tick={tickStyle} width={120} />
                <Tooltip formatter={(v) => money(v)} contentStyle={tooltipStyle} />
                <Bar dataKey="revenue" fill="#b91c1c" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
