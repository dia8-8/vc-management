import { useEffect, useState } from "react";
import api from "../api/client";
import Modal from "../components/Modal";

const emptyForm = { name: "", contactPerson: "", phone: "", email: "", address: "", notes: "" };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);

  function load() {
    setLoading(true);
    api
      .get("/suppliers", { params: search ? { search } : {} })
      .then(({ data }) => setSuppliers(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [search]);

  function openNew() {
    setForm(emptyForm);
    setError("");
    setEditing({});
  }

  function openEdit(s) {
    setForm({
      name: s.name,
      contactPerson: s.contactPerson || "",
      phone: s.phone || "",
      email: s.email || "",
      address: s.address || "",
      notes: s.notes || "",
    });
    setError("");
    setEditing(s);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editing?.id) {
        await api.patch(`/suppliers/${editing.id}`, form);
      } else {
        await api.post("/suppliers", form);
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  }

  async function handleDelete(s) {
    if (!confirm(`Delete supplier "${s.name}"? This cannot be undone.`)) return;
    await api.delete(`/suppliers/${s.id}`);
    load();
  }

  async function openDetail(s) {
    const { data } = await api.get(`/suppliers/${s.id}`);
    setDetail(data);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold dark:text-gray-100">Suppliers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{suppliers.length} total</p>
        </div>
        <button onClick={openNew} className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg">
          + Add Supplier
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, contact, or phone…"
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-800 dark:text-gray-100"
      />

      {loading ? (
        <div className="text-gray-500 dark:text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
          {suppliers.length === 0 && <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">No suppliers yet.</div>}
          {suppliers.map((s) => (
            <div key={s.id} className="p-4 flex items-center justify-between gap-3">
              <button className="text-left flex-1 min-w-0" onClick={() => openDetail(s)}>
                <div className="font-medium text-sm truncate dark:text-gray-100">{s.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {s.contactPerson ? `${s.contactPerson} · ` : ""}
                  {s.phone || "No phone"}
                </div>
              </button>
              <div className="text-right shrink-0">
                <div className="text-xs text-gray-400 dark:text-gray-500">{s.productCount} products</div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(s)} className="text-xs font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1">
                  Edit
                </button>
                <button onClick={() => handleDelete(s)} className="text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2 py-1">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <Modal title={editing.id ? "Edit Supplier" : "Add Supplier"} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm px-3 py-2 rounded-lg">{error}</div>}
            <Field label="Name" required value={form.name} onChange={(v) => setForm((prev) => ({ ...prev, name: v }))} />
            <Field label="Contact person" value={form.contactPerson} onChange={(v) => setForm((prev) => ({ ...prev, contactPerson: v }))} />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm((prev) => ({ ...prev, phone: v }))} />
            <Field label="Email" value={form.email} onChange={(v) => setForm((prev) => ({ ...prev, email: v }))} />
            <Field label="Address" value={form.address} onChange={(v) => setForm((prev) => ({ ...prev, address: v }))} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={2}
              />
            </div>
            <button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg py-2.5 text-sm">
              Save
            </button>
          </form>
        </Modal>
      )}

      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)} maxWidth="max-w-lg">
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              {detail.contactPerson && <div>{detail.contactPerson}</div>}
              {detail.phone && <div>📞 {detail.phone}</div>}
              {detail.email && <div>✉️ {detail.email}</div>}
              {detail.address && <div>📍 {detail.address}</div>}
              {detail.notes && <div className="italic">{detail.notes}</div>}
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2 dark:text-gray-100">Products supplied</h3>
              <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-lg">
                {detail.products.length === 0 && <div className="p-3 text-sm text-gray-500 dark:text-gray-400">No products linked yet.</div>}
                {detail.products.map((p) => (
                  <div key={p.id} className="p-3 flex justify-between text-sm dark:text-gray-200">
                    <div>{p.name}</div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {p.stockQty} {p.unit.toLowerCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2 dark:text-gray-100">Recent stock-ins</h3>
              <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-lg">
                {detail.stockMovements.length === 0 && <div className="p-3 text-sm text-gray-500 dark:text-gray-400">No stock-ins recorded yet.</div>}
                {detail.stockMovements.map((m) => (
                  <div key={m.id} className="p-3 flex justify-between text-sm dark:text-gray-200">
                    <div>
                      <div>{m.product.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(m.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-green-600 dark:text-green-400 font-medium">+{m.quantity}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, value, onChange, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );
}
