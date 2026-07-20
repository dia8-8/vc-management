import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api from "../api/client";
import { parseVariableWeightCode } from "../lib/variableWeightBarcode";

const CAMERA_DIV_ID = "scan-camera-reader";

export default function Scan() {
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [status, setStatus] = useState(null);
  const [recent, setRecent] = useState([]);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [linkProductId, setLinkProductId] = useState("");
  const [processing, setProcessing] = useState(false);

  const inputRef = useRef(null);
  const lastScanRef = useRef({ code: "", time: 0 });
  const html5QrRef = useRef(null);

  useEffect(() => {
    api.get("/suppliers").then(({ data }) => setSuppliers(data));
    api.get("/products").then(({ data }) => setProducts(data));
    api.get("/settings").then(({ data }) => setSettings(data));
  }, []);

  useEffect(() => {
    return () => {
      html5QrRef.current?.stop().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!cameraOn && status?.type !== "notfound") {
      inputRef.current?.focus();
    }
  }, [cameraOn, status]);

  // Camera access must be requested directly inside the click handler (not a
  // useEffect fired afterward) — some mobile browsers silently refuse
  // getUserMedia if it isn't triggered synchronously by a user gesture.
  async function toggleCamera() {
    if (cameraOn) {
      try {
        await html5QrRef.current?.stop();
        html5QrRef.current?.clear();
      } catch {
        // ignore
      }
      html5QrRef.current = null;
      setCameraOn(false);
      return;
    }

    setCameraError("");
    try {
      const instance = new Html5Qrcode(CAMERA_DIV_ID);
      html5QrRef.current = instance;
      await instance.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => handleScan(decodedText),
        () => {}
      );
      setCameraOn(true);
    } catch (err) {
      html5QrRef.current = null;
      setCameraError(
        "Could not access the camera. Make sure you allow camera access when your browser asks, and that no other app is using the camera."
      );
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = barcodeInput.trim();
      setBarcodeInput("");
      if (code) handleScan(code);
    }
  }

  async function lookupProduct(code) {
    try {
      const { data: product } = await api.get(`/products/by-barcode/${encodeURIComponent(code)}`);
      return product;
    } catch (err) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  }

  async function handleScan(rawCode) {
    const code = String(rawCode).trim();
    if (!code || processing) return;
    const now = Date.now();
    if (code === lastScanRef.current.code && now - lastScanRef.current.time < 2500) return;
    lastScanRef.current = { code, time: now };

    setProcessing(true);
    setStatus(null);
    try {
      // Try the raw scanned code first (fixed-barcode products).
      const direct = await lookupProduct(code);
      if (direct) {
        await addStock(direct, code, null);
        return;
      }

      // Fall back to variable-weight parsing (scale labels encoding item + weight).
      const parsed = parseVariableWeightCode(code, settings);
      if (parsed) {
        const product = await lookupProduct(parsed.itemCode);
        if (product) {
          await addStock(product, parsed.itemCode, parsed.weight);
          return;
        }
        setStatus({ type: "notfound", code: parsed.itemCode, weight: parsed.weight });
        return;
      }

      setStatus({ type: "notfound", code });
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.error || "Lookup failed" });
    } finally {
      setProcessing(false);
    }
  }

  async function addStock(product, code, weightOverride) {
    const usesWeight = weightOverride != null;
    const qty = usesWeight ? weightOverride : Number(quantity) || 1;
    const unit = usesWeight ? settings?.variableWeightUnit || "" : "";
    try {
      await api.post("/inventory/movements", {
        productId: product.id,
        type: "IN",
        quantity: qty,
        reason: reason || `Scanned${code ? ` (${code})` : ""}${usesWeight ? ` · ${qty}${unit}` : ""}`,
        supplierId: supplierId || null,
      });
      setStatus({ type: "success", product, quantity: qty, unit });
      setRecent((prev) =>
        [{ id: `${Date.now()}-${product.id}`, name: product.name, quantity: qty, unit, time: new Date() }, ...prev].slice(0, 15)
      );
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.error || "Could not add stock" });
    }
  }

  async function linkAndAdd() {
    if (!linkProductId || !status?.code) return;
    setProcessing(true);
    try {
      const { data: product } = await api.patch(`/products/${linkProductId}`, { barcode: status.code });
      await addStock(product, status.code, status.weight ?? null);
      setLinkProductId("");
    } catch (err) {
      setStatus({ type: "error", message: err.response?.data?.error || "Could not link barcode" });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <h1 className="text-xl font-semibold dark:text-gray-100">Scan to Stock In</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Scan a barcode with a scanner or your camera to add stock instantly</p>
        {settings && !settings.variableWeightEnabled && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Scale labels that encode item + weight in one barcode? Turn on variable-weight parsing in Settings.
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qty per scan</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier (optional)</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">— None —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason / note (optional)</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Weekly supplier delivery"
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hardware scanner</label>
        <input
          ref={inputRef}
          autoFocus
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Click here, then scan…"
          className="w-full border-2 border-brand-200 dark:border-brand-900/50 focus:border-brand-500 rounded-lg px-3 py-3 text-base dark:bg-gray-900 dark:text-gray-100 focus:outline-none"
        />
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Keep this field focused — most USB/Bluetooth scanners type the code then press Enter automatically.
        </p>

        <button
          type="button"
          onClick={toggleCamera}
          className="text-sm font-medium text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/50 bg-brand-50 dark:bg-brand-900/20 rounded-lg px-4 py-2"
        >
          {cameraOn ? "Stop Camera" : "Use Camera Instead"}
        </button>
        {cameraError && <p className="text-xs text-red-600 dark:text-red-400">{cameraError}</p>}
        <div id={CAMERA_DIV_ID} className={cameraOn ? "mt-2" : "hidden"} />
      </div>

      {status?.type === "success" && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/40 rounded-2xl p-4 text-sm text-green-700 dark:text-green-300">
          Added {status.quantity}
          {status.unit ? ` ${status.unit}` : ""} to <span className="font-semibold">{status.product.name}</span>.
        </div>
      )}
      {status?.type === "notfound" && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl p-4 space-y-2">
          <div className="text-sm text-amber-700 dark:text-amber-300">
            No product matches barcode <span className="font-mono">{status.code}</span>
            {status.weight != null && (
              <>
                {" "}
                · parsed weight <span className="font-semibold">{status.weight} {settings?.variableWeightUnit}</span>
              </>
            )}
            .
          </div>
          <div className="flex gap-2">
            <select
              value={linkProductId}
              onChange={(e) => setLinkProductId(e.target.value)}
              className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-2 py-2 text-sm min-w-0"
            >
              <option value="">Select a product to link…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={linkAndAdd}
              disabled={!linkProductId || processing}
              className="text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg px-4 py-2 disabled:opacity-50 shrink-0"
            >
              Link &amp; Add
            </button>
          </div>
        </div>
      )}
      {status?.type === "error" && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-2xl p-4 text-sm text-red-700 dark:text-red-300">
          {status.message}
        </div>
      )}

      {recent.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
          <div className="px-4 py-3 text-sm font-semibold bg-gray-50 dark:bg-gray-900/60 dark:text-gray-100">This Session</div>
          {recent.map((r) => (
            <div key={r.id} className="p-3 flex items-center justify-between text-sm dark:text-gray-200">
              <span>{r.name}</span>
              <span className="flex items-center gap-3">
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  +{r.quantity}
                  {r.unit ? ` ${r.unit}` : ""}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{r.time.toLocaleTimeString()}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
