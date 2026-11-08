import { useEffect, useState } from "react";
import api from "../api/client";
import Modal from "../components/Modal";

const PLAN_STYLES = {
  TRIAL: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  BASIC: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  PRO: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

const inputClass =
  "w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

function statusOf(license) {
  if (license.status === "SUSPENDED") return { label: "Suspended", cls: "text-red-600 dark:text-red-400" };
  if (license.blockedReason === "EXPIRED") return { label: "Expired", cls: "text-red-600 dark:text-red-400" };
  return { label: "Active", cls: "text-green-600 dark:text-green-400" };
}

function toDateInput(iso) {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

export default function Platform() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api
      .get("/platform/tenants")
      .then(({ data }) => setTenants(data))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  function openEdit(t) {
    setForm({
      name: t.name,
      plan: t.license.plan,
      status: t.license.status,
      maxUsers: t.license.maxUsers,
      expiresAt: toDateInput(t.license.expiresAt),
      neverExpires: !t.license.expiresAt,
    });
    setError("");
    setEditing(t);
  }

  async function save(extra = {}) {
    setSaving(true);
    setError("");
    try {
      await api.patch(`/platform/tenants/${editing.id}`, {
        name: form.name,
        plan: form.plan,
        status: form.status,
        maxUsers: Number(form.maxUsers),
        expiresAt: form.neverExpires ? null : form.expiresAt || null,
        ...extra,
      });
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  const active = tenants.filter((t) => !t.license.blocked);
  const stats = [
    { label: "Clients", value: tenants.length },
    { label: "Active", value: active.length },
    { label: "On trial", value: active.filter((t) => t.license.plan === "TRIAL").length },
    { label: "Expired / suspended", value: tenants.length - active.length },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold dark:text-gray-100">Clients &amp; licenses</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Every business using the platform and its license</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{s.label}</div>
            <div className="text-2xl font-semibold dark:text-gray-100">{s.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
          {tenants.length === 0 && <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">No clients yet.</div>}
          {tenants.map((t) => {
            const st = statusOf(t.license);
            return (
              <div key={t.id} className="p-4 flex items-center gap-3 flex-wrap">
                <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm dark:text-gray-100">{t.name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PLAN_STYLES[t.license.plan]}`}>{t.license.plan}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {t.owner ? `${t.owner.name} · ${t.owner.email}` : "No admin"}
                  </div>
                </div>
                <div className="text-xs w-24">
                  <div className="text-gray-400 dark:text-gray-500">Status</div>
                  <div className={`font-medium ${st.cls}`}>{st.label}</div>
                </div>
                <div className="text-xs w-28">
                  <div className="text-gray-400 dark:text-gray-500">Expires</div>
                  <div className="dark:text-gray-200">
                    {t.license.expiresAt
                      ? `${new Date(t.license.expiresAt).toLocaleDateString(undefined, { timeZone: "UTC" })}${t.license.daysLeft !== null && !t.license.blocked ? ` (${t.license.daysLeft}d)` : ""}`
                      : "Never"}
                  </div>
                </div>
                <div className="text-xs w-16">
                  <div className="text-gray-400 dark:text-gray-500">Users</div>
                  <div className="dark:text-gray-200">
                    {t.userCount} / {t.license.maxUsers}
                  </div>
                </div>
                <div className="text-xs w-14">
                  <div className="text-gray-400 dark:text-gray-500">Orders</div>
                  <div className="dark:text-gray-200">{t.orderCount}</div>
                </div>
                <button
                  onClick={() => openEdit(t)}
                  className="text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Manage
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editing && form && (
        <Modal title={`License: ${editing.name}`} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm px-3 py-2 rounded-lg">{error}</div>}

            <div>
              <label className={labelClass}>Company name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Plan</label>
                <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className={inputClass}>
                  <option value="TRIAL">Trial (all features)</option>
                  <option value="BASIC">Basic</option>
                  <option value="PRO">Pro</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Max users</label>
                <input
                  type="number"
                  min="1"
                  value={form.maxUsers}
                  onChange={(e) => setForm({ ...form, maxUsers: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Expires on</label>
                <input
                  type="date"
                  disabled={form.neverExpires}
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className={`${inputClass} disabled:opacity-50`}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.neverExpires}
                onChange={(e) => setForm({ ...form, neverExpires: e.target.checked })}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              Never expires
            </label>

            <div className="flex gap-2 flex-wrap">
              {[30, 90, 365].map((d) => (
                <button
                  key={d}
                  type="button"
                  disabled={saving}
                  onClick={() => save({ extendDays: d, expiresAt: undefined })}
                  className="text-xs font-medium text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/50 bg-brand-50 dark:bg-brand-900/20 rounded-lg px-3 py-1.5 disabled:opacity-60"
                >
                  +{d} days
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => save()}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg py-2.5 text-sm disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save license"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
