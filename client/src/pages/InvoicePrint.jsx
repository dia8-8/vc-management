import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";

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

export default function InvoicePrint() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get(`/orders/${id}`), api.get("/settings")])
      .then(([o, s]) => {
        setOrder(o.data);
        setSettings(s.data);
      })
      .catch((err) => setError(err.response?.data?.error || "Could not load invoice"));
  }, [id]);

  if (error)
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6 text-red-600 text-sm">{error}</div>
      </div>
    );
  if (!order || !settings)
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6 text-gray-500 text-sm">Loading…</div>
      </div>
    );

  const balanceDue = Number(order.total) - Number(order.amountPaid);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 print:min-h-0 print:bg-white">
    <div className="max-w-2xl mx-auto p-6 print:p-0">
      <div className="flex justify-end mb-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
        >
          Print
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 print:border-0 print:rounded-none print:p-0 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xl font-bold">{settings.companyName}</div>
            {settings.address && <div className="text-sm text-gray-500">{settings.address}</div>}
            {settings.phone && <div className="text-sm text-gray-500">{settings.phone}</div>}
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold">Invoice</div>
            <div className="text-sm text-gray-500">{order.orderNumber}</div>
            <div className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="flex items-start justify-between border-t border-b border-gray-100 py-4">
          <div>
            <div className="text-xs font-medium text-gray-400 mb-1">Bill To</div>
            <div className="text-sm font-medium">{order.customer.name}</div>
            {order.customer.businessName && <div className="text-sm text-gray-500">{order.customer.businessName}</div>}
            {order.customer.address && <div className="text-sm text-gray-500">{order.customer.address}</div>}
            {order.customer.phone && <div className="text-sm text-gray-500">{order.customer.phone}</div>}
          </div>
          <div className="text-right">
            <div className="text-xs font-medium text-gray-400 mb-1">Status</div>
            <div className="text-sm">{STATUS_LABELS[order.status] || order.status}</div>
            <div className="text-xs font-medium text-gray-400 mt-2 mb-1">Payment</div>
            <div className="text-sm">{order.paymentStatus}</div>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-400 border-b border-gray-100">
              <th className="pb-2">Item</th>
              <th className="pb-2 text-right">Qty</th>
              <th className="pb-2 text-right">Unit Price</th>
              <th className="pb-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id} className="border-b border-gray-50">
                <td className="py-2">{it.product?.name || "Product"}</td>
                <td className="py-2 text-right">{it.quantity}</td>
                <td className="py-2 text-right">{money(it.unitPrice)}</td>
                <td className="py-2 text-right">{money(it.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-56 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{money(order.subtotal)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Discount</span>
                <span>-{money(order.discount)}</span>
              </div>
            )}
            {Number(order.deliveryFee) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery fee</span>
                <span>{money(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base pt-1 border-t border-gray-200">
              <span>Total</span>
              <span>{money(order.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Paid</span>
              <span>{money(order.amountPaid)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Balance Due</span>
              <span>{money(balanceDue)}</span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="border-t border-gray-100 pt-4">
            <div className="text-xs font-medium text-gray-400 mb-1">Notes</div>
            <div className="text-sm text-gray-600">{order.notes}</div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
