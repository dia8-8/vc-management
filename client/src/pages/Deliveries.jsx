import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

function money(n) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n || 0);
}

const STATUS_LABELS = {
  PENDING: "Pending",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};
const STATUS_COLORS = {
  PENDING: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  PREPARING: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  OUT_FOR_DELIVERY: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  DELIVERED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export default function Deliveries() {
  const { user } = useAuth();
  if (user?.role === "DRIVER") return <DriverView />;
  return <DispatchView />;
}

function DriverView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});

  function load() {
    setLoading(true);
    api
      .get("/orders")
      .then(({ data }) => {
        setOrders(data.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED"));
        setNotes((prev) => {
          const next = { ...prev };
          data.forEach((o) => {
            if (next[o.id] === undefined) next[o.id] = o.deliveryNotes || "";
          });
          return next;
        });
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function advance(order, status) {
    await api.patch(`/orders/${order.id}/status`, { status, deliveryNotes: notes[order.id] || "" });
    load();
  }

  async function saveNotes(order) {
    await api.patch(`/orders/${order.id}/status`, { status: order.status, deliveryNotes: notes[order.id] || "" });
    load();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold dark:text-gray-100">My Deliveries</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{orders.length} assigned</p>
      </div>

      {loading ? (
        <div className="text-gray-500 dark:text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="space-y-3">
          {orders.length === 0 && <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No deliveries assigned to you.</div>}
          {orders.map((o) => (
            <div key={o.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-semibold text-sm dark:text-gray-100">{o.orderNumber}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{o.customer.name}</div>
                  {o.customer.address && <div className="text-xs text-gray-400 dark:text-gray-500">{o.customer.address}</div>}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm dark:text-gray-100">{money(o.total)}</div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[o.status]}`}>{STATUS_LABELS[o.status]}</span>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                {o.items.map((it) => (
                  <div key={it.id} className="text-xs text-gray-600 dark:text-gray-300 flex justify-between">
                    <span>{it.quantity} × {it.product?.name || "product"}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Delivery notes</label>
                <div className="flex gap-2">
                  <input
                    value={notes[o.id] || ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [o.id]: e.target.value }))}
                    className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-2 py-1.5 text-xs"
                    placeholder="e.g. left at back door"
                  />
                  <button onClick={() => saveNotes(o)} className="text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 shrink-0">
                    Save
                  </button>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                {o.status === "PREPARING" && (
                  <button
                    onClick={() => advance(o, "OUT_FOR_DELIVERY")}
                    className="flex-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg py-2"
                  >
                    Mark Out for Delivery
                  </button>
                )}
                {o.status === "OUT_FOR_DELIVERY" && (
                  <button
                    onClick={() => advance(o, "DELIVERED")}
                    className="flex-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg py-2"
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DispatchView() {
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    Promise.all([api.get("/orders"), api.get("/orders/drivers")])
      .then(([o, d]) => {
        setOrders(o.data.filter((ord) => ord.status !== "DELIVERED" && ord.status !== "CANCELLED"));
        setDrivers(d.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function assignDriver(order, assignedDriverId) {
    await api.patch(`/orders/${order.id}/assign-driver`, { assignedDriverId: assignedDriverId || null });
    load();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold dark:text-gray-100">Deliveries</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{orders.length} orders in progress</p>
      </div>

      {loading ? (
        <div className="text-gray-500 dark:text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="space-y-3">
          {orders.length === 0 && <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No orders awaiting delivery.</div>}
          {orders.map((o) => (
            <div key={o.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-semibold text-sm dark:text-gray-100">{o.orderNumber}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{o.customer.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm dark:text-gray-100">{money(o.total)}</div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[o.status]}`}>{STATUS_LABELS[o.status]}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <label className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Driver</label>
                <select
                  value={o.assignedDriverId || ""}
                  onChange={(e) => assignDriver(o, e.target.value)}
                  className="text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-2 py-1.5"
                >
                  <option value="">— Unassigned —</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {o.deliveryNotes && <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">{o.deliveryNotes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
