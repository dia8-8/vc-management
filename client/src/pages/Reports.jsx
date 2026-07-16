import { useEffect, useState } from "react";
import api from "../api/client";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useTheme } from "../context/ThemeContext";

function money(n) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n || 0);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const PRESETS = [
  { label: "Last 7 days", from: () => daysAgoStr(6), to: () => todayStr() },
  { label: "Last 30 days", from: () => daysAgoStr(29), to: () => todayStr() },
  { label: "This month", from: () => todayStr().slice(0, 8) + "01", to: () => todayStr() },
];

function StatCard({ label, value, tone = "default" }) {
  const tones = {
    default: "text-gray-900 dark:text-gray-100",
    good: "text-green-600 dark:text-green-400",
    bad: "text-red-600 dark:text-red-400",
  };
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${tones[tone]}`}>{value}</div>
    </div>
  );
}

export default function Reports() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridStroke = isDark ? "#374151" : "#f3f4f6";
  const tickStyle = { fontSize: 11, fill: isDark ? "#9ca3af" : "#6b7280" };
  const tooltipStyle = isDark ? { backgroundColor: "#1f2937", border: "1px solid #374151", color: "#f3f4f6" } : undefined;
  const [from, setFrom] = useState(daysAgoStr(29));
  const [to, setTo] = useState(todayStr());
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const params = { from, to };
    Promise.all([
      api.get("/reports/summary", { params }),
      api.get("/reports/trend", { params }),
      api.get("/reports/top-products", { params: { ...params, limit: 5 } }),
      api.get("/reports/top-customers", { params: { ...params, limit: 5 } }),
    ])
      .then(([s, t, p, c]) => {
        setSummary(s.data);
        setTrend(t.data.trend);
        setTopProducts(p.data);
        setTopCustomers(c.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [from, to]);

  const trendData = (trend || []).map((d) => {
    const [y, m, day] = d.date.split("-").map(Number);
    return { ...d, label: new Date(y, m - 1, day).toLocaleDateString("en-CA", { month: "short", day: "numeric" }) };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold dark:text-gray-100">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sales, profit and expenses summary</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setFrom(p.from());
                setTo(p.to());
              }}
              className="text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {p.label}
            </button>
          ))}
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <span className="text-gray-400 dark:text-gray-500 text-sm">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {loading || !summary ? (
        <div className="text-gray-500 dark:text-gray-400 text-sm">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard label="Orders" value={summary.orderCount} />
            <StatCard label="Total Sales" value={money(summary.totalSales)} />
            <StatCard label="Total Expenses" value={money(summary.totalExpenses)} tone="bad" />
            <StatCard label="Gross Profit" value={money(summary.grossProfit)} tone={summary.grossProfit >= 0 ? "good" : "bad"} />
            <StatCard label="Net Profit" value={money(summary.netProfit)} tone={summary.netProfit >= 0 ? "good" : "bad"} />
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-3 dark:text-gray-100">Sales, Expenses &amp; Profit</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="salesFillR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b91c1c" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#b91c1c" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitFillR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="label" tick={tickStyle} />
                <YAxis tick={tickStyle} width={50} />
                <Tooltip formatter={(v) => money(v)} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={isDark ? { color: "#e5e7eb" } : undefined} />
                <Area type="monotone" dataKey="sales" name="Sales" stroke="#b91c1c" fill="url(#salesFillR)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#16a34a" fill="url(#profitFillR)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
              <h2 className="text-sm font-semibold px-4 pt-4 pb-2 dark:text-gray-100">Top Products</h2>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {topProducts.length === 0 && <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No sales in this period.</div>}
                {topProducts.map((p) => (
                  <div key={p.name} className="px-4 py-2.5 flex items-center justify-between text-sm dark:text-gray-200">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{p.quantity} units</div>
                    </div>
                    <div className="font-semibold">{money(p.revenue)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
              <h2 className="text-sm font-semibold px-4 pt-4 pb-2 dark:text-gray-100">Top Customers</h2>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {topCustomers.length === 0 && <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No sales in this period.</div>}
                {topCustomers.map((c) => (
                  <div key={c.name} className="px-4 py-2.5 flex items-center justify-between text-sm dark:text-gray-200">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{c.orderCount} orders</div>
                    </div>
                    <div className="font-semibold">{money(c.total)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
