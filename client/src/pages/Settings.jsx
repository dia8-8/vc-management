import { useEffect, useState } from "react";
import api from "../api/client";
import { parseVariableWeightCode } from "../lib/variableWeightBarcode";

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
        variableWeightEnabled: form.variableWeightEnabled,
        variableWeightPrefix: form.variableWeightPrefix,
        variableWeightItemStart: form.variableWeightItemStart,
        variableWeightItemLength: form.variableWeightItemLength,
        variableWeightWeightStart: form.variableWeightWeightStart,
        variableWeightWeightLength: form.variableWeightWeightLength,
        variableWeightDecimals: form.variableWeightDecimals,
        variableWeightUnit: form.variableWeightUnit,
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

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="vwEnabled"
              checked={form.variableWeightEnabled}
              onChange={(e) => setForm({ ...form, variableWeightEnabled: e.target.checked })}
              className="mt-1 rounded border-gray-300 dark:border-gray-600"
            />
            <label htmlFor="vwEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable variable-weight barcodes (scale-printed meat/deli labels)
            </label>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            When scanning in the Scan page, if a code doesn't exactly match a product's saved barcode, we'll try reading it
            as &lt;prefix&gt;&lt;item code&gt;&lt;weight&gt; using the layout below, then look up just the item code against
            products' barcodes and use the decoded weight as the stock-in quantity.
          </p>

          {form.variableWeightEnabled && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prefix (leading digit(s))</label>
                  <input
                    value={form.variableWeightPrefix}
                    onChange={(e) => setForm({ ...form, variableWeightPrefix: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight unit</label>
                  <select
                    value={form.variableWeightUnit}
                    onChange={(e) => setForm({ ...form, variableWeightUnit: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item code start (0-based)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.variableWeightItemStart}
                    onChange={(e) => setForm({ ...form, variableWeightItemStart: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item code length</label>
                  <input
                    type="number"
                    min="1"
                    value={form.variableWeightItemLength}
                    onChange={(e) => setForm({ ...form, variableWeightItemLength: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight start (0-based)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.variableWeightWeightStart}
                    onChange={(e) => setForm({ ...form, variableWeightWeightStart: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight length</label>
                  <input
                    type="number"
                    min="1"
                    value={form.variableWeightWeightLength}
                    onChange={(e) => setForm({ ...form, variableWeightWeightLength: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Decimal places in weight</label>
                <input
                  type="number"
                  min="0"
                  max="6"
                  value={form.variableWeightDecimals}
                  onChange={(e) => setForm({ ...form, variableWeightDecimals: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  E.g. weight digits "00850" with 3 decimal places → {(850 / 1000).toFixed(3)} {form.variableWeightUnit}.
                </p>
              </div>

              <VariableWeightTester settings={form} />
            </>
          )}
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

function VariableWeightTester({ settings }) {
  const [testCode, setTestCode] = useState("");
  const trimmed = testCode.trim();
  const parsed = trimmed ? parseVariableWeightCode(trimmed, settings) : null;

  return (
    <div className="bg-gray-50 dark:bg-gray-900/60 rounded-lg p-3 space-y-2">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">Test with a sample code (not saved)</label>
      <input
        value={testCode}
        onChange={(e) => setTestCode(e.target.value)}
        placeholder="e.g. 2123450085003"
        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm font-mono"
      />
      {trimmed &&
        (parsed ? (
          <div className="text-xs text-green-700 dark:text-green-400">
            Item code: <span className="font-mono font-semibold">{parsed.itemCode}</span> · Weight:{" "}
            <span className="font-semibold">
              {parsed.weight} {settings.variableWeightUnit}
            </span>
          </div>
        ) : (
          <div className="text-xs text-red-600 dark:text-red-400">
            Doesn't match this layout — check the prefix, or the code may be too short for these positions.
          </div>
        ))}
    </div>
  );
}
