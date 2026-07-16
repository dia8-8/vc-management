import { useEffect, useState } from "react";
import api from "../api/client";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["FUEL", "RENT", "SALARIES", "UTILITIES", "OTHER"];
const CATEGORY_LABELS = { FUEL: "Fuel", RENT: "Rent", SALARIES: "Salaries", UTILITIES: "Utilities", OTHER: "Other" };

function money(n) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n || 0);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm = { date: todayStr(), category: "FUEL", amount: "", note: "" };

export default function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [category, setCategory] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    const params = {};
    if (category) params.category = category;
    if (from) params.from = from;
    if (to) params.to = to;
    api
      .get("/expenses", { params })
      .then(({ data }) => setExpenses(data))
      .finally(() => setLoading(false));
  }

  useEffect(load, [category, from, to]);

  function openNew() {
    setForm(emptyForm);
    setError("");
    setEditing({});
  }

  function openEdit(e) {
    setForm({
      date: e.date.slice(0, 10),
      category: e.category,
      amount: e.amount,
      note: e.note || "",
    });
    setError("");
    setEditing(e);
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    try {
      if (editing?.id) {
        await api.patch(`/expenses/${editing.id}`, form);
      } else {
        await api.post("/expenses", form);
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  }

  async function handleDelete(e) {
    if (!confirm(`Delete this ${CATEGORY_LABELS[e.category]} expense of ${money(e.amount)}?`)) return;
    await api.delete(`/expenses/${e.id}`);
    load();
  }

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold dark:text-gray-100">Expenses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{expenses.length} entries · {money(total)} total</p>
        </div>
        <button onClick={openNew} className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg">
          + Add Expense
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {loading ? (
        <div className="text-gray-500 dark:text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
          {expenses.length === 0 && <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">No expenses recorded.</div>}
          {expenses.map((e) => (
            <div key={e.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm dark:text-gray-100">
                  {CATEGORY_LABELS[e.category]}
                  {e.note ? ` · ${e.note}` : ""}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(e.date).toLocaleDateString(undefined, { timeZone: "UTC" })} · {e.createdBy?.name || "System"}
                </div>
              </div>
              <div className="font-semibold text-sm shrink-0 dark:text-gray-100">{money(e.amount)}</div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(e)} className="text-xs font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1">
                  Edit
                </button>
                {user?.role === "ADMIN" && (
                  <button onClick={() => handleDelete(e)} className="text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2 py-1">
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <Modal title={editing.id ? "Edit Expense" : "Add Expense"} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm px-3 py-2 rounded-lg">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note</label>
              <input
                value={form.note}
                onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg py-2.5 text-sm">
              Save
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
