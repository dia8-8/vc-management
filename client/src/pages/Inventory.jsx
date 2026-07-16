import { useEffect, useState } from "react";
import api from "../api/client";
import Modal from "../components/Modal";

const TYPE_LABELS = { IN: "Incoming stock", OUT: "Sale", ADJUSTMENT: "Adjustment", WASTE: "Waste / damaged" };

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalProduct, setModalProduct] = useState(null);
  const [form, setForm] = useState({ type: "IN", quantity: "", reason: "", supplierId: "" });
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    Promise.all([api.get("/products"), api.get("/inventory/movements")])
      .then(([p, m]) => {
        setProducts(p.data);
        setMovements(m.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);
  useEffect(() => {
    api.get("/suppliers").then(({ data }) => setSuppliers(data));
  }, []);

  function openMovement(product) {
    setForm({ type: "IN", quantity: "", reason: "", supplierId: product.supplierId || "" });
    setError("");
    setModalProduct(product);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.post("/inventory/movements", { productId: modalProduct.id, ...form, supplierId: form.supplierId || null });
      setModalProduct(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  }

  const lowStock = products.filter((p) => Number(p.stockQty) <= Number(p.lowStockThreshold));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold dark:text-gray-100">Inventory</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Stock levels and movement history</p>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">⚠️ Low stock ({lowStock.length})</h2>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((p) => (
              <span key={p.id} className="text-xs bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-full">
                {p.name}: {p.stockQty} {p.unit.toLowerCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
        <div className="px-4 py-3 text-sm font-semibold bg-gray-50 dark:bg-gray-900/60 dark:text-gray-100">Current Stock</div>
        {loading && <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Loading…</div>}
        {!loading && products.length === 0 && <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No products yet.</div>}
        {products.map((p) => {
          const low = Number(p.stockQty) <= Number(p.lowStockThreshold);
          return (
            <div key={p.id} className="p-4 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate dark:text-gray-100">{p.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{p.category}</div>
              </div>
              <div className={`text-sm font-semibold shrink-0 w-24 text-right ${low ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"}`}>
                {p.stockQty} {p.unit.toLowerCase()}
              </div>
              <button
                onClick={() => openMovement(p)}
                className="text-xs font-medium text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/50 bg-brand-50 dark:bg-brand-900/20 rounded-lg px-3 py-1.5 shrink-0 w-20 text-center"
              >
                Adjust
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
        <div className="px-4 py-3 text-sm font-semibold bg-gray-50 dark:bg-gray-900/60 dark:text-gray-100">Recent Movements</div>
        {movements.length === 0 && <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No movements recorded yet.</div>}
        {movements.slice(0, 30).map((m) => (
          <div key={m.id} className="p-3 flex items-center justify-between gap-3 text-sm">
            <div className="min-w-0">
              <div className="font-medium truncate dark:text-gray-100">{m.product.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {m.reason || TYPE_LABELS[m.type] || m.type}
                {m.order ? ` (${Math.abs(Number(m.quantity))} ${m.product.unit.toLowerCase()})` : ""}
                {m.supplier ? ` · ${m.supplier.name}` : ""}
                {m.order?.customer ? ` · ${m.order.customer.name}` : ""} · {m.createdBy?.name || "System"} ·{" "}
                {new Date(m.createdAt).toLocaleString()}
              </div>
            </div>
            <div className={`font-semibold shrink-0 ${Number(m.quantity) < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
              {Number(m.quantity) > 0 ? "+" : ""}
              {m.quantity}
            </div>
          </div>
        ))}
      </div>

      {modalProduct && (
        <Modal title={`Adjust Stock — ${modalProduct.name}`} onClose={() => setModalProduct(null)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm px-3 py-2 rounded-lg">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Movement type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="IN">Incoming stock (new delivery)</option>
                <option value="ADJUSTMENT">Adjustment (correct a count, +/-)</option>
                <option value="WASTE">Waste / damaged product</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantity {form.type === "ADJUSTMENT" ? "(use negative to reduce)" : ""}
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            {form.type === "IN" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
                <select
                  value={form.supplierId}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">— None —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason / notes</label>
              <input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="e.g. Supplier delivery, spoilage, recount"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg py-2.5 text-sm">
              Save Movement
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
