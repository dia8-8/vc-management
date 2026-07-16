import { useEffect, useRef, useState } from "react";
import { loadGooglePlaces } from "../lib/googleMaps";

export default function AddressAutocomplete({ label, value, onChange }) {
  const containerRef = useRef(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let element;
    let listener;

    loadGooglePlaces()
      .then(({ PlaceAutocompleteElement }) => {
        if (cancelled || !containerRef.current) return;
        element = new PlaceAutocompleteElement({ placeholder: "Search for an address…" });
        containerRef.current.appendChild(element);
        listener = async (e) => {
          const place = e.placePrediction.toPlace();
          await place.fetchFields({ fields: ["formattedAddress"] });
          onChange(place.formattedAddress || "");
        };
        element.addEventListener("gmp-select", listener);
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      });

    return () => {
      cancelled = true;
      if (element && listener) element.removeEventListener("gmp-select", listener);
      element?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {!unavailable && <div ref={containerRef} className="mb-1" />}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Address"
        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );
}
