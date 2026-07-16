import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/client";
import Modal from "../components/Modal";

const PAGE_SIZE = 10;

function money(n) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n || 0);
}

const STATUSES = ["PENDING", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
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

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [paymentCounts, setPaymentCounts] = useState({ UNPAID: 0, PARTIAL: 0, PAID: 0 });
  const [totalCount, setTotalCount] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [payingOrder, setPayingOrder] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);

  const statusFilter = searchParams.get("status") || "";
  const paymentFilter = searchParams.get("paymentStatus") || "";

  useEffect(() => {
    Promise.all([api.get("/customers"), api.get("/products")]).then(([c, p]) => {
      setCustomers(c.data);
      setProducts(p.data.filter((pr) => pr.active));
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, paymentFilter, debouncedSearch]);

  function load() {
    setLoading(true);
    const params = { limit: PAGE_SIZE, offset: page * PAGE_SIZE };
    if (statusFilter) params.status = statusFilter;
    if (paymentFilter) params.paymentStatus = paymentFilter;
    if (debouncedSearch) params.search = debouncedSearch;
    const countParams = {};
    if (statusFilter) countParams.status = statusFilter;
    if (paymentFilter) countParams.paymentStatus = paymentFilter;
    if (debouncedSearch) countParams.search = debouncedSearch;
    Promise.all([api.get("/orders", { params }), api.get("/orders/status-counts", { params: countParams })])
      .then(([o, sc]) => {
        setOrders(o.data);
        setStatusCounts(sc.data.counts);
        setPaymentCounts(sc.data.paymentCounts);
        setTotalCount(sc.data.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [statusFilter, paymentFilter, debouncedSearch, page]);

  const totalForFilter = statusFilter ? statusCounts[statusFilter] || 0 : totalCount;
  const totalPages = Math.max(1, Math.ceil(totalForFilter / PAGE_SIZE));
  const unpaidCount = (paymentCounts.UNPAID || 0) + (paymentCounts.PARTIAL || 0);

  async function handleStatusChange(order, status) {
    await api.patch(`/orders/${order.id}/status`, { status });
    load();
  }

  async function openPayment(order) {
    setPaymentAmount("");
    setPaymentNote("");
    setPaymentError("");
    setPayingOrder(order);
    const { data } = await api.get(`/orders/${order.id}`);
    setPayingOrder(data);
  }

  async function submitPayment(e) {
    e.preventDefault();
    setPaymentError("");
    if (!paymentAmount || Number(paymentAmount) <= 0) return setPaymentError("Enter a payment amount");
    setSubmittingPayment(true);
    try {
      const { data } = await api.post(`/orders/${payingOrder.id}/payments`, { amount: Number(paymentAmount), note: paymentNote || undefined });
      setPayingOrder(data);
      setPaymentAmount("");
      setPaymentNote("");
      load();
    } catch (err) {
      setPaymentError(err.response?.data?.error || "Something went wrong");
    } finally {
      setSubmittingPayment(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold dark:text-gray-100">Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{totalForFilter} total</p>
        </div>
        <button onClick={() => setShowNew(true)} className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg">
          + New Order
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by order number or customer…"
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-800 dark:text-gray-100"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip active={!statusFilter} onClick={() => setSearchParams((p) => { p.delete("status"); return p; })}>
          All ({totalCount})
        </FilterChip>
        {STATUSES.map((s) => (
          <FilterChip key={s} active={statusFilter === s} onClick={() => setSearchParams((p) => { p.set("status", s); return p; })}>
            {STATUS_LABELS[s]} ({statusCounts[s] || 0})
          </FilterChip>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip active={!paymentFilter} onClick={() => setSearchParams((p) => { p.delete("paymentStatus"); return p; })}>
          Any payment
        </FilterChip>
        <FilterChip active={paymentFilter === "UNPAID"} onClick={() => setSearchParams((p) => { p.set("paymentStatus", "UNPAID"); return p; })}>
          Unpaid ({unpaidCount})
        </FilterChip>
        <FilterChip active={paymentFilter === "PARTIAL"} onClick={() => setSearchParams((p) => { p.set("paymentStatus", "PARTIAL"); return p; })}>
          Partial ({paymentCounts.PARTIAL || 0})
        </FilterChip>
        <FilterChip active={paymentFilter === "PAID"} onClick={() => setSearchParams((p) => { p.set("paymentStatus", "PAID"); return p; })}>
          Paid ({paymentCounts.PAID || 0})
        </FilterChip>
      </div>

      {loading ? (
        <div className="text-gray-500 dark:text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="space-y-3">
          {orders.length === 0 && <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No orders found.</div>}
          {orders.map((o) => (
            <div key={o.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-semibold text-sm dark:text-gray-100">{o.orderNumber}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{o.customer.name}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{new Date(o.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm dark:text-gray-100">{money(o.total)}</div>
                  <div className={`text-xs font-medium ${o.paymentStatus === "PAID" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                    {o.paymentStatus} {o.paymentStatus !== "PAID" && `· ${money(o.total - o.amountPaid)} due`}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[o.status]}`}>{STATUS_LABELS[o.status]}</span>
                {o.status !== "CANCELLED" && o.status !== "DELIVERED" && (
                  <select
                    value={o.status}
                    onChange={(e) => handleStatusChange(o, e.target.value)}
                    className="text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-2 py-1"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                )}
                {o.status !== "CANCELLED" && o.paymentStatus !== "PAID" && (
                  <button onClick={() => openPayment(o)} className="text-xs font-medium text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/50 bg-brand-50 dark:bg-brand-900/20 rounded-lg px-3 py-1">
                    Record Payment
                  </button>
                )}
                {o.status === "PENDING" && (
                  <button onClick={() => setEditingOrder(o)} className="text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1">
                    Edit
                  </button>
                )}
                <a
                  href={`/orders/${o.id}/invoice`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1"
                >
                  Invoice
                </a>
              </div>

              <details className="mt-2">
                <summary className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer">{o.items.length} item(s)</summary>
                <div className="mt-2 space-y-1">
                  {o.items.map((it) => (
                    <div key={it.id} className="text-xs text-gray-600 dark:text-gray-300 flex justify-between">
                      <span>{it.quantity} × {it.product?.name || "product"}</span>
                      <span>{money(it.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
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

      {(showNew || editingOrder) && (
        <NewOrderModal
          customers={customers}
          products={products}
          order={editingOrder}
          onClose={() => {
            setShowNew(false);
            setEditingOrder(null);
          }}
          onCreated={() => {
            setShowNew(false);
            setEditingOrder(null);
            load();
          }}
        />
      )}

      {payingOrder && (
        <Modal title={`Record Payment — ${payingOrder.orderNumber}`} onClose={() => setPayingOrder(null)}>
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900/60 rounded-lg p-3 text-sm space-y-1 dark:text-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Order total</span>
                <span>{money(payingOrder.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Paid so far</span>
                <span>{money(payingOrder.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t border-gray-200 dark:border-gray-700">
                <span>Balance due</span>
                <span>{money(payingOrder.total - payingOrder.amountPaid)}</span>
              </div>
            </div>

            <form onSubmit={submitPayment} className="space-y-3">
              {paymentError && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm px-3 py-2 rounded-lg">{paymentError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (optional)</label>
                <input
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g. e-transfer, cash on delivery"
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                disabled={submittingPayment}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg py-2.5 text-sm disabled:opacity-60"
              >
                {submittingPayment ? "Saving…" : "Add Payment"}
              </button>
            </form>

            <div>
              <h3 className="text-sm font-semibold mb-2 dark:text-gray-100">Payment History</h3>
              <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-lg max-h-48 overflow-y-auto">
                {(!payingOrder.payments || payingOrder.payments.length === 0) && (
                  <div className="p-3 text-sm text-gray-500 dark:text-gray-400">No payments recorded yet.</div>
                )}
                {(payingOrder.payments || []).map((pay) => (
                  <div key={pay.id} className="p-3 flex justify-between text-sm dark:text-gray-200">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(pay.createdAt).toLocaleString()} · {pay.createdBy?.name || "System"}
                      </div>
                      {pay.note && <div className="text-xs text-gray-400 dark:text-gray-500 italic">{pay.note}</div>}
                    </div>
                    <div className="font-medium">{money(pay.amount)}</div>
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

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border ${
        active
          ? "bg-brand-500 border-brand-500 text-white"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

function NewOrderModal({ customers, products, order, onClose, onCreated }) {
  const isEditing = !!order;
  const [customerId, setCustomerId] = useState(order?.customerId || "");
  const [customerPrices, setCustomerPrices] = useState(new Map());
  const [lines, setLines] = useState(
    order?.items?.length
      ? order.items.map((it) => ({ productId: it.productId, quantity: String(it.quantity), unitPrice: String(it.unitPrice) }))
      : [{ productId: "", quantity: "", unitPrice: "" }]
  );
  const [discount, setDiscount] = useState(order ? String(order.discount) : "0");
  const [deliveryFee, setDeliveryFee] = useState(order ? String(order.deliveryFee) : "0");
  const [notes, setNotes] = useState(order?.notes || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savingPrice, setSavingPrice] = useState(null);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  useEffect(() => {
    if (!customerId) {
      setCustomerPrices(new Map());
      return;
    }
    api.get(`/customers/${customerId}/prices`).then(({ data }) => {
      setCustomerPrices(new Map(data.map((cp) => [cp.productId, Number(cp.unitPrice)])));
    });
  }, [customerId]);

  function priceFor(productId) {
    if (customerPrices.has(productId)) return customerPrices.get(productId);
    const p = productMap.get(productId);
    return p ? Number(p.sellingPrice) : 0;
  }

  const subtotal = lines.reduce((sum, l) => {
    if (!l.productId || !l.quantity) return sum;
    const unitPrice = l.unitPrice !== "" ? Number(l.unitPrice) : priceFor(l.productId);
    return sum + unitPrice * Number(l.quantity);
  }, 0);
  const total = Math.max(0, subtotal - Number(discount || 0)) + Number(deliveryFee || 0);

  function updateLine(i, patch) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function selectProduct(i, productId) {
    updateLine(i, { productId, unitPrice: productId ? String(priceFor(productId)) : "" });
  }
  function addLine() {
    setLines((prev) => [...prev, { productId: "", quantity: "", unitPrice: "" }]);
  }
  function removeLine(i) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function saveCustomerPrice(i) {
    const line = lines[i];
    if (!customerId || !line.productId || line.unitPrice === "") return;
    setSavingPrice(i);
    try {
      await api.put(`/customers/${customerId}/prices/${line.productId}`, { unitPrice: Number(line.unitPrice) });
      setCustomerPrices((prev) => new Map(prev).set(line.productId, Number(line.unitPrice)));
    } finally {
      setSavingPrice(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const items = lines
      .filter((l) => l.productId && l.quantity)
      .map((l) => ({
        productId: l.productId,
        quantity: Number(l.quantity),
        unitPrice: l.unitPrice !== "" ? Number(l.unitPrice) : priceFor(l.productId),
      }));
    if (!customerId) return setError("Select a customer");
    if (items.length === 0) return setError("Add at least one product");

    setSubmitting(true);
    try {
      const payload = { customerId, items, discount: Number(discount || 0), deliveryFee: Number(deliveryFee || 0), notes };
      if (isEditing) {
        await api.patch(`/orders/${order.id}`, payload);
      } else {
        await api.post("/orders", payload);
      }
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={isEditing ? `Edit Order — ${order.orderNumber}` : "New Order"} onClose={onClose} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm px-3 py-2 rounded-lg">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer</label>
          <select
            required
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Products</label>
          <div className="space-y-2">
            {lines.map((l, i) => {
              const p = productMap.get(l.productId);
              const defaultPrice = l.productId ? priceFor(l.productId) : 0;
              const isCustomized = l.productId && l.unitPrice !== "" && Number(l.unitPrice) !== defaultPrice;
              const hasCustomerPrice = l.productId && customerPrices.has(l.productId);
              return (
                <div key={i} className="space-y-1 border border-gray-100 dark:border-gray-700 rounded-lg p-2">
                  <div className="flex gap-2 items-center">
                    <select
                      value={l.productId}
                      onChange={(e) => selectProduct(i, e.target.value)}
                      className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-2 py-2 text-sm min-w-0"
                    >
                      <option value="">Select product…</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} ({prod.stockQty} {prod.unit.toLowerCase()} avail.)
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Qty"
                      value={l.quantity}
                      onChange={(e) => updateLine(i, { quantity: e.target.value })}
                      className="w-16 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-2 py-2 text-sm"
                    />
                    <button type="button" onClick={() => removeLine(i)} className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 shrink-0">
                      ✕
                    </button>
                  </div>
                  {p && (
                    <div className="flex gap-2 items-center pl-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Unit price</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={l.unitPrice}
                        onChange={(e) => updateLine(i, { unitPrice: e.target.value })}
                        className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-2 py-1 text-sm"
                      />
                      {hasCustomerPrice && !isCustomized && (
                        <span className="text-[10px] text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 rounded-full px-2 py-0.5 shrink-0">customer price</span>
                      )}
                      {isCustomized && (
                        <button
                          type="button"
                          onClick={() => saveCustomerPrice(i)}
                          disabled={savingPrice === i}
                          className="text-[11px] font-medium text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/50 bg-brand-50 dark:bg-brand-900/20 rounded-lg px-2 py-1 shrink-0 disabled:opacity-60"
                        >
                          {savingPrice === i ? "Saving…" : "Save as customer price"}
                        </button>
                      )}
                      <div className="flex-1 text-xs text-gray-500 dark:text-gray-400 text-right shrink-0">
                        {l.quantity ? money(Number(l.unitPrice || 0) * Number(l.quantity)) : ""}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button type="button" onClick={addLine} className="mt-2 text-xs font-medium text-brand-600 dark:text-brand-400">
            + Add another product
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount</label>
            <input
              type="number"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery fee</label>
            <input
              type="number"
              step="0.01"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/60 rounded-lg p-3 text-sm space-y-1 dark:text-gray-200">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base pt-1 border-t border-gray-200 dark:border-gray-700">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg py-2.5 text-sm disabled:opacity-60"
        >
          {submitting ? "Saving…" : isEditing ? "Save Changes" : "Create Order"}
        </button>
      </form>
    </Modal>
  );
}
