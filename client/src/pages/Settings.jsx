import { useEffect, useState } from "react";
import api from "../api/client";

export default function Settings() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/settings").then(({ data }) => setForm(data));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const { data } = await api.patch("/settings", {
        companyName: form.companyName,
        address: form.address,
        phone: form.phone,
        invoicePrefix: form.invoicePrefix,
        currency: form.currency,
        defaultLowStockThreshold: form.defaultLowStockThreshold,
        taxRate: form.taxRate,
      });
      setForm(data);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <div className="text-gray-500 dark:text-gray-400">Loading…</div>;

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <h1 className="text-xl font-semibold dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Company info and invoicing defaults</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm space-y-3">
        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm px-3 py-2 rounded-lg">{error}</div>}
        {saved && <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm px-3 py-2 rounded-lg">Settings saved</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company name</label>
          <input
            required
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
          <input
            value={form.address || ""}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
          <input
            value={form.phone || ""}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice prefix</label>
            <input
              required
              value={form.invoicePrefix}
              onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
            <input
              required
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default low stock threshold</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.defaultLowStockThreshold}
              onChange={(e) => setForm({ ...form, defaultLowStockThreshold: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax rate (0–1)</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.0001"
              required
              value={form.taxRate}
              onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg py-2.5 text-sm disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
