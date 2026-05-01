import { useEffect, useRef, useState } from "react";

interface LatLng {
  lat: number;
  lng: number;
}

interface LocationMapProps {
  position?: LatLng;
  onPositionChange: (pos: LatLng) => void;
  searchQuery?: string;
}

const ALUBIJID_CENTER: LatLng = { lat: 8.5731, lng: 124.4736 };

/**
 * Client-only Leaflet map. Renders a draggable marker; emits coordinates on click.
 * Geocoding via leaflet-geosearch (OpenStreetMap) when `searchQuery` changes.
 */
export function LocationMap({ position, onPositionChange, searchQuery }: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  const providerRef = useRef<unknown>(null);
  const [ready, setReady] = useState(false);

  // Initialise Leaflet on mount (client-side only)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      const { OpenStreetMapProvider } = await import("leaflet-geosearch");
      if (cancelled || !containerRef.current) return;

      // Default marker icon fix for bundlers
      const iconRetinaUrl = (await import("leaflet/dist/images/marker-icon-2x.png")).default;
      const iconUrl = (await import("leaflet/dist/images/marker-icon.png")).default;
      const shadowUrl = (await import("leaflet/dist/images/marker-shadow.png")).default;
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl,
        iconUrl,
        shadowUrl,
      });

      const initial = position ?? ALUBIJID_CENTER;
      const map = L.map(containerRef.current).setView([initial.lat, initial.lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const marker = L.marker([initial.lat, initial.lng], {
        draggable: true,
        title: "Selected project location",
        alt: "Selected project location",
      }).addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onPositionChange({ lat: pos.lat, lng: pos.lng });
      });
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng(e.latlng);
        onPositionChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      mapRef.current = map;
      markerRef.current = marker;
      providerRef.current = new OpenStreetMapProvider();
      setReady(true);
    })();

    return () => {
      cancelled = true;
      const map = mapRef.current as { remove: () => void } | null;
      if (map) map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external position prop -> map
  useEffect(() => {
    if (!ready || !position) return;
    const map = mapRef.current as { setView: (latlng: [number, number], zoom: number) => void } | null;
    const marker = markerRef.current as { setLatLng: (latlng: [number, number]) => void } | null;
    if (map && marker) {
      marker.setLatLng([position.lat, position.lng]);
      map.setView([position.lat, position.lng], 14);
    }
  }, [ready, position?.lat, position?.lng]);

  // Geocode searchQuery -> position
  useEffect(() => {
    if (!ready || !searchQuery || searchQuery.trim().length < 4) return;
    const handle = setTimeout(async () => {
      const provider = providerRef.current as
        | { search: (opts: { query: string }) => Promise<{ x: number; y: number; label: string }[]> }
        | null;
      if (!provider) return;
      try {
        const results = await provider.search({ query: searchQuery });
        if (results.length > 0) {
          const r = results[0];
          onPositionChange({ lat: r.y, lng: r.x });
        }
      } catch (err) {
        console.warn("Geocode failed", err);
      }
    }, 600);
    return () => clearTimeout(handle);
  }, [searchQuery, ready]);

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border border-border/50">
      <div ref={containerRef} className="h-full w-full bg-muted" />
      {position && (
        <div className="absolute bottom-3 right-3 bg-card/95 backdrop-blur px-3 py-2 rounded-lg border border-border/50 flex gap-3 text-[10px] z-[400] shadow">
          <div>
            <p className="font-bold uppercase text-muted-foreground">Lat</p>
            <p className="font-mono font-bold text-primary">{position.lat.toFixed(4)}</p>
          </div>
          <div className="w-px bg-border" />
          <div>
            <p className="font-bold uppercase text-muted-foreground">Lng</p>
            <p className="font-mono font-bold text-primary">{position.lng.toFixed(4)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
