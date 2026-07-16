function bootstrap(apiKey) {
  if (window.google?.maps?.importLibrary) return;
  ((g) => {
    let h, a, k;
    const p = "The Google Maps JavaScript API";
    const c = "google";
    const l = "importLibrary";
    const q = "__ib__";
    const m = document;
    let b = window;
    b = b[c] || (b[c] = {});
    const d = b.maps || (b.maps = {});
    const r = new Set();
    const e = new URLSearchParams();
    const u = () =>
      h ||
      (h = new Promise(async (resolve, reject) => {
        await (a = m.createElement("script"));
        e.set("libraries", [...r] + "");
        for (k in g) e.set(k.replace(/[A-Z]/g, (t) => "_" + t[0].toLowerCase()), g[k]);
        e.set("callback", c + ".maps." + q);
        a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
        d[q] = resolve;
        a.onerror = () => (h = reject(new Error(p + " could not load.")));
        a.nonce = m.querySelector("script[nonce]")?.nonce || "";
        m.head.append(a);
      }));
    d[l] ? console.warn(p + " only loads once. Ignoring:", g) : (d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)));
  })({ key: apiKey, v: "weekly" });
}

let placesLibPromise = null;

export function loadGooglePlaces() {
  if (placesLibPromise) return placesLibPromise;
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.reject(new Error("VITE_GOOGLE_MAPS_API_KEY is not set"));
  bootstrap(apiKey);
  placesLibPromise = window.google.maps.importLibrary("places");
  return placesLibPromise;
}
