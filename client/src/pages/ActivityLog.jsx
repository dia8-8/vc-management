import { useEffect, useState } from "react";
import api from "../api/client";

const ENTITY_TYPES = ["Order", "Payment", "Customer", "Product", "Supplier", "Expense", "User"];
const PAGE_SIZE = 25;

const ACTION_COLORS = {
  CREATE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function formatDetails(details) {
  if (!details) return "";
  try {
    const obj = JSON.parse(details);
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  } catch {
    return details;
  }
}

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [entityType, setEntityType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const params = { limit: PAGE_SIZE, offset: page * PAGE_SIZE };
    if (entityType) params.entityType = entityType;
    if (from) params.from = from;
    if (to) params.to = to;
    api
      .get("/activity-log", { params })
      .then(({ data }) => {
        setLogs(data.logs);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [entityType, from, to, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold dark:text-gray-100">Activity Log</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} entries</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <select
          value={entityType}
          onChange={(e) => {
            setPage(0);
            setEntityType(e.target.value);
          }}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All entity types</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => {
            setPage(0);
            setFrom(e.target.value);
          }}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => {
            setPage(0);
            setTo(e.target.value);
          }}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {loading ? (
        <div className="text-gray-500 dark:text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
          {logs.length === 0 && <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">No activity recorded.</div>}
          {logs.map((l) => (
            <div key={l.id} className="p-4 flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ACTION_COLORS[l.action] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                    {l.action}
                  </span>
                  <span className="text-sm font-medium dark:text-gray-100">{l.entityType}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{l.user?.name || "System"}</span>
                </div>
                {l.details && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{formatDetails(l.details)}</div>}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{new Date(l.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-gray-500 dark:text-gray-400">
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
