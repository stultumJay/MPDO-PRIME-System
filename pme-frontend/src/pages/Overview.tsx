import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AppIcon } from "@/components/ui/AppIcon";
import {
  getOverviewData,
  type OverviewPayload,
} from "@/services/overview.service";

const SpatialSnapshotMap = lazy(() => import('../components/dashboard/SpatialSnapshotMap'))

function formatPHP(amount: number): string {
  if (amount >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₱${(amount / 1_000).toFixed(0)}K`;
  return `₱${amount.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours} Hour${hours === 1 ? "" : "s"} Ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} Days Ago`;
}

function buildFallbackMonths(count: number) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "long" });
  const current = new Date();
  current.setDate(1);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(current.getFullYear(), current.getMonth() - (count - 1 - index), 1);
    return {
      month: formatter.format(date),
      allocated: 0,
      utilized: 0,
    };
  });
}

function useRevealOnce<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [revealed]);

  return [ref, revealed] as const;
}

function useCountUp(value: number, enabled: boolean, duration = 700) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setDisplayValue(0);
      return;
    }

    let frame = 0;
    let startTime: number | null = null;

    const animate = (time: number) => {
      if (startTime === null) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * eased);

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [duration, enabled, value]);

  return displayValue;
}

export default function Overview() {
  const navigate = useNavigate();
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [financialKpisRef, financialKpisRevealed] = useRevealOnce<HTMLElement>();
  const [financialChartRef, financialChartRevealed] = useRevealOnce<HTMLDivElement>();
  const overviewQuery = useQuery({
    queryKey: ["overview", "dashboard"],
    queryFn: () =>
      getOverviewData({
        months: 6,
        pulseLimit: 5,
      }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const data = overviewQuery.data ?? null;
  const loading = overviewQuery.isLoading;
  const error = overviewQuery.error instanceof Error ? overviewQuery.error.message : null;

  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowMap(true), 300)
    return () => clearTimeout(t)
  }, [])

  const financial = data?.financial ?? [];
  const chartData = useMemo(() => {
    const seen = new Map<string, { month: string; allocated: number; utilized: number }>();
    const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long" });

    financial.forEach((row, index) => {
      const key = row.year ? `${row.year}-${row.month}` : `${index}-${row.month}`;
      if (!seen.has(key)) {
        const parsedDate = new Date(`${row.month} 1, ${row.year ?? new Date().getFullYear()}`);
        seen.set(key, {
          month: Number.isNaN(parsedDate.getTime()) ? row.month : monthFormatter.format(parsedDate),
          allocated: row.allocated,
          utilized: row.utilized,
        });
        return;
      }

      const current = seen.get(key)!;
      current.allocated += row.allocated;
      current.utilized += row.utilized;
    });

    const months = [...seen.values()];
    return months.length ? months : buildFallbackMonths(6);
  }, [financial]);
  const maxFinancial = Math.max(...chartData.flatMap((m) => [m.allocated, m.utilized]), 1);
  const animatedUtilization = useCountUp(
    data?.kpis.utilization_percent ?? 0,
    financialKpisRevealed && Boolean(data),
  );
  const animatedFundsUtilized = useCountUp(
    data?.kpis.funds_utilized ?? 0,
    financialKpisRevealed && Boolean(data),
  );
  

  // const markerBounds = useMemo(() => {
  //   if (!data?.markers.length) return null;

  //   const lats = data.markers.map((m) => m.latitude);
  //   const lngs = data.markers.map((m) => m.longitude);

  //   return {
  //     minLat: Math.min(...lats),
  //     maxLat: Math.max(...lats),
  //     minLng: Math.min(...lngs),
  //     maxLng: Math.max(...lngs),
  //   };
  // }, [data]);

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold">Dashboard failed to load</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => void overviewQuery.refetch()}
            className="mt-4 rounded bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const overview = data as OverviewPayload;
  const { kpis, sectors, activity, markers } = overview;
  const filteredSectors = sectors;
  const filteredActivity = activity;
  const filteredMarkers = markers;

  // const markerPosition = (latitude: number, longitude: number) => {
  //   if (!markerBounds) return { left: 50, top: 50 };

  //   const lngSpan = markerBounds.maxLng - markerBounds.minLng;
  //   const latSpan = markerBounds.maxLat - markerBounds.minLat;

  //   const left =
  //     lngSpan === 0
  //       ? 50
  //       : ((longitude - markerBounds.minLng) / lngSpan) * 100;

  //   const top =
  //     latSpan === 0
  //       ? 50
  //       : 100 - ((latitude - markerBounds.minLat) / latSpan) * 100;

  //   return {
  //     left: clamp(left, 5, 95),
  //     top: clamp(top, 5, 85),
  //   };
  // };

  return (
    <AppShell
      topbar={{
        title: "Executive Dashboard Overview",
      }}
    >

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto p-5 xl:gap-6 xl:p-6">
        <header className="flex shrink-0 items-center justify-between">
          <div>
            <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-[#04776d]">
              System Intelligence
            </span>
            <h1 className="text-2xl font-black tracking-tight">
              Executive Dashboard
            </h1>
          </div>
          <button
            type="button"
            onClick={() => void navigate({ to: "/projects/create" })}
            className="flex items-center gap-2 rounded bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            <AppIcon name="add" className="h-4 w-4" />
            NEW PROJECT
          </button>
        </header>

        {error ? (
          <div className="rounded border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <section ref={financialKpisRef} className="grid shrink-0 grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Total Projects"
            value={kpis.total_projects}
            icon="folder"
            tone="primary"
          />
          <KpiCard
            label="In Progress"
            value={kpis.ongoing}
            icon="sync"
            tone="ongoing"
          />
          <KpiCard
            label="Completed"
            value={kpis.completed}
            icon="check_circle"
            tone="completed"
          />
          <KpiCard
            label="Delayed"
            value={kpis.delayed}
            icon="warning"
            tone="delayed"
          />
          <KpiCard
            label="Utilization"
            value={`${animatedUtilization.toFixed(1)}%`}
            icon="trending_up"
            tone="utilization"
          />
          <KpiCard
            label="Funds Utilized"
            value={formatPHP(animatedFundsUtilized)}
            icon="payments"
            tone="primary"
          />
        </section>

        <div className="grid min-h-0 grid-cols-1 gap-5 xl:grid-cols-12 xl:gap-6">
          <div className="flex flex-col gap-5 xl:col-span-8 xl:gap-6">
            <div ref={financialChartRef} className="flex h-[360px] flex-col overflow-hidden rounded border border-border/50 bg-card p-5 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold">Financial Trajectory</h2>
                  <p className="text-[10px] text-muted-foreground">
                    Allocated vs. Utilized Capital (6M Cycle)
                  </p>
                </div>
                <div className="flex gap-4 text-[10px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-emerald-500" />
                    ALLOCATED
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-sky-500" />
                    UTILIZED
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-x-auto px-1 pb-1">
                <div className="flex h-[250px] min-w-[520px] items-end gap-4">
                  {chartData.map((month) => {
                    const allocatedHeight = month.allocated > 0 ? Math.max(14, (month.allocated / maxFinancial) * 100) : 12;
                    const utilizedHeight = month.utilized > 0 ? Math.max(14, (month.utilized / maxFinancial) * 100) : 12;
                    const key = month.month;

                    return (
                      <div
                        key={key}
                        className="group relative flex h-full min-w-14 flex-1 flex-col items-center justify-end gap-2"
                        onMouseEnter={() => setHoveredMonth(key)}
                        onMouseLeave={() => setHoveredMonth(null)}
                      >
                        {hoveredMonth === key ? (
                          <div className="absolute -top-20 z-10 w-40 rounded bg-foreground px-3 py-2 text-[10px] font-bold text-background shadow-lg">
                            <p>{month.month}</p>
                            <p>Allocated: {formatPHP(month.allocated)}</p>
                            <p>Utilized: {formatPHP(month.utilized)}</p>
                          </div>
                        ) : null}
                        <div className="flex h-[210px] w-full items-end justify-center gap-2 px-1">
                          <div className="flex h-full w-7 min-w-6 items-end rounded-t bg-emerald-100">
                            <div
                              className="w-full rounded-t bg-emerald-500 transition-all duration-300"
                              style={{
                                height: `${financialChartRevealed ? allocatedHeight : 0}%`,
                                opacity: financialChartRevealed && month.allocated > 0 ? 1 : 0.28,
                              }}
                            />
                          </div>
                          <div className="flex h-full w-7 min-w-6 items-end rounded-t bg-sky-100">
                            <div
                              className="w-full rounded-t bg-sky-500 transition-all duration-300"
                              style={{
                                height: `${financialChartRevealed ? utilizedHeight : 0}%`,
                                opacity: financialChartRevealed && month.utilized > 0 ? 1 : 0.28,
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">{month.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="shrink-0 rounded border border-border/50 bg-card p-5 shadow-sm">
              <h2 className="mb-5 text-sm font-bold">Sector Impact Analysis</h2>
              <div className="grid grid-cols-1 gap-x-12 gap-y-4 md:grid-cols-2">
                {filteredSectors.map((s) => (
                  <div key={s.sector_id} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                      <span>{s.sector_name}</span>
                      <span>{s.project_count}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(s.share * 100, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 xl:col-span-4 xl:gap-6">
            <div className="flex min-h-[280px] flex-1 flex-col overflow-hidden rounded border border-border/50 bg-card p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-sm font-bold">Institutional Pulse</h2>
                <button
                  type="button"
                  onClick={() => void navigate({ to: "/audit" })}
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  AUDIT LOG
                </button>
              </div>

              <div className="flex-1 space-y-4 pr-1">
                {filteredActivity.map((evt, idx) => {
                  const tone =
                    evt.highlight_tone === "danger"
                      ? "bg-status-delayed"
                      : evt.highlight_tone === "info"
                        ? "bg-status-ongoing"
                        : "bg-primary";

                  const highlightTone =
                    evt.highlight_tone === "danger"
                      ? "text-status-delayed font-bold italic"
                      : "text-primary font-bold";

                  return (
                    <div key={evt.id} className="relative flex gap-4">
                      {idx < filteredActivity.length - 1 && (
                        <div className="absolute bottom-[-18px] left-[7px] top-4 w-px bg-border" />
                      )}
                      <div
                        className={`z-10 mt-0.5 h-4 w-4 shrink-0 rounded-full ${tone} border-2 border-card ring-1 ring-border`}
                      />
                      <div>
                        <p className="text-xs font-bold leading-tight">
                          {evt.project_title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {evt.detail}{" "}
                          {evt.highlight && (
                            <span className={highlightTone}>{evt.highlight}</span>
                          )}
                        </p>
                        <p className="mt-1 text-[9px] font-bold uppercase text-muted-foreground">
                          {relativeTime(evt.occurred_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {!filteredActivity.length && (
                  <p className="text-sm text-muted-foreground">
                    No recent activity available.
                  </p>
                )}
              </div>
            </div>

            <div className="flex h-[280px] shrink-0 flex-col rounded border border-border/50 bg-card p-2 shadow-sm">
              <div className="px-3 py-2">
                <h2 className="text-xs font-bold">Spatial Distribution</h2>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Map Monitoring Preview
                </p>
              </div>
              <div className="m-1 flex-1 overflow-hidden rounded bg-muted">
                <div className="relative h-full w-full">
                  {showMap ? (
                    <Suspense fallback={<div className="w-full h-full bg-muted animate-pulse rounded" />}>
                      <SpatialSnapshotMap
                        projects={filteredMarkers.map(mk => ({
                        id: mk.project_id,
                        latitude: mk.latitude,
                        longitude: mk.longitude,
                        sector: mk.sector ?? "OTHERS",
                        name: mk.title,
                        status: mk.status,
                      }))}
                    />
                    </Suspense>
                  ) : (
                    <div className="w-full h-full bg-muted animate-pulse rounded" />
                  )}
    
                  <button
                    type="button"
                    onClick={() => void navigate({ to: "/map" })}
                    className="absolute bottom-3 right-3 rounded border border-border bg-card px-3 py-1.5 text-[10px] font-bold text-foreground shadow-sm transition-colors hover:bg-muted"
                  >
                    OPEN INTERACTIVE MAP
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
