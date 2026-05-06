import { useEffect, useMemo, useRef, useState } from "react";
import "@/styles/materialSymbols.css";
import { useNavigate } from "@tanstack/react-router";
import { AppShell } from "../components/layout/AppShell";
import {
  formatCompactPHP,
  getMapData,
  type MapPayload,
  type MapProjectMarker,
  type MapSector,
  type MapStatus,
} from "@/services/map.service";
import type { LayerGroup, Map as LeafletMap } from "leaflet";

type LeafletModule = typeof import("leaflet");

const sectorOptions: MapSector[] = [
  "Infrastructure",
  "Social",
  "Economic",
  "Environment",
  "Institutional",
  "Others",
];

const initialSectorState: Record<MapSector, boolean> = {
  Infrastructure: true,
  Social: true,
  Economic: false,
  Environment: false,
  Institutional: false,
  Others: false,
};

const sectorMeta: Record<MapSector, { marker: string }> = {
  Infrastructure: { marker: "bg-primary" },
  Social: { marker: "bg-status-utilization" },
  Economic: { marker: "bg-status-delayed" },
  Environment: { marker: "bg-status-completed" },
  Institutional: { marker: "bg-slate-500" },
  Others: { marker: "bg-slate-400" },
};

export default function Map() {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersLayerRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const loadedYearRef = useRef<number | null>(null);
  const [search, setSearch] = useState("");
  const [barangay, setBarangay] = useState("All Barangays");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<MapStatus>("On Track");
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [legendOpen, setLegendOpen] = useState(true);
  const [sectorState, setSectorState] =
    useState<Record<MapSector, boolean>>(initialSectorState);
  const [payload, setPayload] = useState<MapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (selectedYear !== null && loadedYearRef.current === selectedYear) return;
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getMapData(selectedYear ?? undefined);
        if (!mounted) return;
        setPayload(data);
        loadedYearRef.current = data.fiscalYear;
        if (selectedYear !== data.fiscalYear) setSelectedYear(data.fiscalYear);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load map data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [selectedYear]);

  const markers = payload?.markers ?? [];
  const yearOptions = payload?.years ?? [];
  const barangays = useMemo(() => ["All Barangays", ...(payload?.barangays ?? [])], [payload]);

  const filteredMarkers = useMemo(() => {
    const loweredSearch = search.trim().toLowerCase();

    return markers.filter((marker) => {
      const matchesSector = sectorState[marker.sector];
      const matchesStatus = marker.status === selectedStatus;
      const matchesBarangay =
        barangay === "All Barangays" || marker.barangay === barangay;
      const matchesSearch =
        loweredSearch.length === 0 ||
        marker.name.toLowerCase().includes(loweredSearch) ||
        marker.barangay.toLowerCase().includes(loweredSearch) ||
        marker.sector.toLowerCase().includes(loweredSearch);

      return (
        matchesSector &&
        matchesStatus &&
        matchesBarangay &&
        matchesSearch
      );
    });
  }, [barangay, markers, search, sectorState, selectedStatus]);

  useEffect(() => {
    if (
      selectedMarkerId &&
      !filteredMarkers.some((marker) => marker.id === selectedMarkerId)
    ) {
      setSelectedMarkerId(null);
    }
  }, [filteredMarkers, selectedMarkerId]);

  const selectedMarker = useMemo<MapProjectMarker | null>(
    () =>
      filteredMarkers.find((marker) => marker.id === selectedMarkerId) ?? null,
    [filteredMarkers, selectedMarkerId],
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    let cancelled = false;

    async function initMap() {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([8.5731, 124.4736], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);

      leafletRef.current = L;
      mapRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
    }

    void initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      leafletRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const layer = markersLayerRef.current;
    if (!mapReady || !L || !layer) return;

    layer.clearLayers();

    filteredMarkers.forEach((marker) => {
      const isSelected = selectedMarkerId === marker.id;
      const icon = L.divIcon({
        className: "",
        html: `<span class="flex flex-col items-center transition ${isSelected ? "scale-110" : ""}"><span class="material-symbols-outlined text-[38px] leading-none drop-shadow-lg ${isSelected ? "text-primary" : "text-white"}" style="-webkit-text-stroke: 2px rgba(15, 23, 42, 0.35); font-variation-settings: 'FILL' 1, 'wght' 700, 'GRAD' 0, 'opsz' 40;">location_on</span><span class="-mt-7 h-3.5 w-3.5 rounded-full border border-white ${sectorMeta[marker.sector].marker}"></span></span>`,
        iconSize: [40, 44],
        iconAnchor: [20, 42],
      });

      L.marker([marker.lat, marker.lng], {
        icon,
        title: `${marker.name} (${marker.code})`,
      })
        .on("click", () => setSelectedMarkerId(marker.id))
        .addTo(layer);
    });
  }, [filteredMarkers, mapReady, selectedMarkerId]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map || !filteredMarkers.length || selectedMarkerId) {
      return;
    }

    const bounds = L.latLngBounds(
      filteredMarkers.map((marker) => [marker.lat, marker.lng] as [number, number]),
    );
    map.fitBounds(bounds, {
      animate: true,
      maxZoom: 13,
      padding: [56, 56],
    });
  }, [filteredMarkers, mapReady, selectedMarkerId]);

  useEffect(() => {
    if (!selectedMarker || !mapRef.current) return;
    mapRef.current.panTo([selectedMarker.lat, selectedMarker.lng], {
      animate: true,
    });
  }, [selectedMarker]);

  const totalFund = useMemo(
    () => filteredMarkers.reduce((sum, marker) => sum + marker.budget, 0),
    [filteredMarkers],
  );

  const statusCounts = useMemo(
    () => ({
      "On Track": markers.filter((marker) => marker.status === "On Track").length,
      Delayed: markers.filter((marker) => marker.status === "Delayed").length,
      Completed: markers.filter((marker) => marker.status === "Completed").length,
    }),
    [markers],
  );

  const toggleSector = (sector: MapSector) => {
    setSectorState((current) => ({
      ...current,
      [sector]: !current[sector],
    }));
  };

  const focusFirstMarker = () => {
    if (!filteredMarkers.length) return;
    const marker = filteredMarkers[0];
    setSelectedMarkerId(marker.id);
    if (mapRef.current) {
      mapRef.current.setView(
        [marker.lat, marker.lng],
        Math.max(mapRef.current.getZoom(), 13),
        { animate: true },
      );
    }
  };

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 overflow-hidden bg-[#edf2f6]">
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-[50px] items-center justify-between border-b border-border/60 bg-card px-6">
            <div className="flex items-center gap-8">
              <h2 className="text-[13px] font-black uppercase tracking-[0.02em] text-foreground">
                Map-Based Monitoring
              </h2>
              <div className="relative hidden md:block">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground">
                  search
                </span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search projects by location..."
                  className="h-10 w-[360px] rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {["notifications", "help", "apps"].map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className="text-foreground transition hover:text-primary"
                >
                  <span className="material-symbols-outlined text-[22px]">{icon}</span>
                </button>
              ))}
              <div className="ml-2 flex items-center gap-3 border-l border-border pl-4">
                <div className="text-right leading-tight">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground">
                    Admin Portal
                  </p>
                  <p className="text-sm font-bold text-foreground">Alubijid Admin</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-[12px] font-black text-primary">
                  JC
                </div>
              </div>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-[224px_minmax(0,1fr)] overflow-hidden">
            <aside className="flex min-h-0 flex-col border-r border-border/60 bg-[#eef3f7]">
              <div className="px-4 py-4">
                <p className="text-[14px] font-bold text-foreground">Filters</p>
                {loading ? (
                  <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                    Loading map records...
                  </p>
                ) : null}
                {error ? (
                  <p className="mt-1 text-[11px] font-semibold text-destructive">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4">
                <div className="space-y-8 pb-6">
                  <section className="space-y-3">
                    <p className="text-[12px] font-black uppercase tracking-[0.18em] text-foreground/85">
                      Municipality Area
                    </p>
                    <div className="relative">
                      <select
                        value={barangay}
                        onChange={(event) => setBarangay(event.target.value)}
                        className="h-10 w-full appearance-none rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none"
                      >
                        {barangays.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground">
                        expand_more
                      </span>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <p className="text-[12px] font-black uppercase tracking-[0.18em] text-foreground/85">
                      Project Sector
                    </p>
                    <div className="space-y-2 text-[14px]">
                      {sectorOptions.map((sector) => (
                        <label key={sector} className="flex items-center gap-3 text-foreground">
                          <input
                            type="checkbox"
                            checked={sectorState[sector]}
                            onChange={() => toggleSector(sector)}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span className={sectorState[sector] ? "" : "text-muted-foreground"}>
                            {sector}
                          </span>
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <p className="text-[12px] font-black uppercase tracking-[0.18em] text-foreground/85">
                      Status Focus
                    </p>
                    <div className="space-y-2">
                      {(["On Track", "Delayed", "Completed"] as MapStatus[]).map(
                        (status) => {
                          const isActive = selectedStatus === status;

                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setSelectedStatus(status)}
                              className={`flex h-9 w-full items-center justify-between rounded-md px-3 text-left text-sm font-semibold transition ${
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-card text-foreground hover:bg-card/80"
                              }`}
                            >
                              <span>{status}</span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-black ${
                                  isActive
                                    ? "bg-primary-foreground/15 text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {String(statusCounts[status]).padStart(2, "0")}
                              </span>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <p className="text-[12px] font-black uppercase tracking-[0.18em] text-foreground/85">
                      Fiscal Year
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {yearOptions.map((year) => (
                        <button
                          key={year}
                          type="button"
                          onClick={() => setSelectedYear(year)}
                          className={`rounded-full px-3 py-1.5 text-[12px] font-black transition ${
                            selectedYear === year
                              ? "bg-[#39d6c7] text-slate-900"
                              : "bg-card text-muted-foreground"
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              <div className="border-t border-border/60 px-4 py-5">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Total Monitored Fund
                </p>
                <p className="mt-2 text-[2rem] font-black tracking-tight text-primary">
                  {formatCompactPHP(totalFund)}
                </p>
              </div>
            </aside>

            <div className="relative min-h-0 overflow-hidden">
              <div ref={mapContainerRef} className="h-full w-full bg-muted" />

              <div className="pointer-events-none absolute inset-0 z-[500] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />

              {legendOpen ? (
                <div className="absolute right-[84px] top-5 z-[900] w-[172px] rounded-2xl bg-card/92 px-4 py-3 shadow-lg backdrop-blur">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-foreground">
                    Map Legend
                  </p>
                  <div className="mt-3 space-y-2.5">
                    {sectorOptions.map((sector) => (
                      <div
                        key={sector}
                        className="flex items-center justify-between gap-3 text-[12px] leading-none"
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${sectorMeta[sector].marker}`}
                          />
                          <span className="font-medium text-foreground">{sector}</span>
                        </span>
                        <span className="text-[10px] font-black uppercase text-muted-foreground">
                          {sector.slice(0, 3)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="absolute right-6 top-[168px] z-[900] flex flex-col gap-2">
                {[
                  {
                    icon: "my_location",
                    label: "Focus first visible project",
                    action: focusFirstMarker,
                  },
                  {
                    icon: "layers",
                    label: legendOpen ? "Hide legend" : "Show legend",
                    action: () => setLegendOpen((current) => !current),
                  },
                ].map((control, index) => (
                  <button
                    key={control.icon}
                    type="button"
                    aria-label={control.label}
                    title={control.label}
                    onClick={control.action}
                    className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-md transition ${
                      index === 1
                        ? "bg-primary text-primary-foreground"
                        : "bg-card/95 text-foreground"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {control.icon}
                    </span>
                  </button>
                ))}
              </div>

              {!loading && !filteredMarkers.length ? (
                <div className="absolute left-1/2 top-8 z-[900] -translate-x-1/2 rounded-xl bg-card/95 px-4 py-3 text-sm font-semibold text-muted-foreground shadow-lg backdrop-blur">
                  No mapped projects match the current filters.
                </div>
              ) : null}

              {selectedMarker ? (
                <div className="absolute bottom-6 left-6 z-[900] w-[360px] rounded-3xl border border-card/70 bg-card/95 p-5 shadow-2xl backdrop-blur">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${sectorMeta[selectedMarker.sector].marker}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {selectedMarker.icon}
                          </span>
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                            {selectedMarker.code}
                          </p>
                          <h3 className="truncate text-base font-black text-foreground">
                            {selectedMarker.name}
                          </h3>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
                        <div>
                          <p className="font-black uppercase tracking-[0.12em] text-muted-foreground">
                            Barangay
                          </p>
                          <p className="mt-1 font-bold text-foreground">
                            {selectedMarker.barangay}
                          </p>
                        </div>
                        <div>
                          <p className="font-black uppercase tracking-[0.12em] text-muted-foreground">
                            Status
                          </p>
                          <p className="mt-1 font-bold text-foreground">
                            {selectedMarker.status}
                          </p>
                        </div>
                        <div>
                          <p className="font-black uppercase tracking-[0.12em] text-muted-foreground">
                            Sector
                          </p>
                          <p className="mt-1 font-bold text-foreground">
                            {selectedMarker.sector}
                          </p>
                        </div>
                        <div>
                          <p className="font-black uppercase tracking-[0.12em] text-muted-foreground">
                            Budget
                          </p>
                          <p className="mt-1 font-bold text-primary">
                            {formatCompactPHP(selectedMarker.budget)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMarkerId(null)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-muted/80"
                      aria-label="Close project details"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      {selectedMarker.lat.toFixed(4)}, {selectedMarker.lng.toFixed(4)}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        void navigate({
                          to: "/projects/$projectId",
                          params: { projectId: selectedMarker.id },
                        })
                      }
                      className="rounded-xl bg-primary px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-primary/90"
                    >
                      View Project
                    </button>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => void navigate({ to: "/projects/create" })}
                className="absolute bottom-6 right-6 z-[900] flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/25 transition hover:bg-primary/90"
                aria-label="Create project"
                title="Create project"
              >
                <span className="material-symbols-outlined text-[28px]">add</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
