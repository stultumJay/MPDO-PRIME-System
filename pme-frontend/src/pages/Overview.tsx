import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AppIcon } from "@/components/ui/AppIcon";
import {
  getOverviewData,
  type OverviewPayload,
} from "@/services/overview.service";

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function Overview() {
  const navigate = useNavigate();
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const overviewQuery = useQuery({
    queryKey: ["overview", "dashboard"],
    queryFn: () =>
      getOverviewData({
        months: 6,
        pulseLimit: 8,
      }),
  });
  const data = overviewQuery.data ?? null;
  const loading = overviewQuery.isLoading;
  const error = overviewQuery.error instanceof Error ? overviewQuery.error.message : null;

  const markerBounds = useMemo(() => {
    if (!data?.markers.length) return null;

    const lats = data.markers.map((m) => m.latitude);
    const lngs = data.markers.map((m) => m.longitude);

    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  }, [data]);

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
  const { kpis, financial, sectors, activity, markers } = overview;

  const maxFinancial = Math.max(
    ...financial.flatMap((m) => [m.allocated, m.utilized]),
    1,
  );

  const markerPosition = (latitude: number, longitude: number) => {
    if (!markerBounds) return { left: 50, top: 50 };

    const lngSpan = markerBounds.maxLng - markerBounds.minLng;
    const latSpan = markerBounds.maxLat - markerBounds.minLat;

    const left =
      lngSpan === 0
        ? 50
        : ((longitude - markerBounds.minLng) / lngSpan) * 100;

    const top =
      latSpan === 0
        ? 50
        : 100 - ((latitude - markerBounds.minLat) / latSpan) * 100;

    return {
      left: clamp(left, 5, 95),
      top: clamp(top, 5, 85),
    };
  };

  return (
    <AppShell>
      <Topbar title="Executive Dashboard Overview" />

      <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
        <header className="flex shrink-0 items-center justify-between">
          <div>
            <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
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

        <section className="grid shrink-0 grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Total Projects"
            value={kpis.total_projects}
            icon="folder"
            tone="primary"
          />
          <KpiCard
            label="Ongoing"
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
            value={`${kpis.utilization_percent}%`}
            icon="trending_up"
            tone="utilization"
          />
          <KpiCard
            label="Funds Utilized"
            value={formatPHP(kpis.funds_utilized)}
            icon="payments"
            tone="primary"
          />
        </section>

        <div className="grid min-h-0 grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="flex flex-col gap-6 xl:col-span-8">
            <div className="flex min-h-[280px] flex-1 flex-col rounded border border-border/50 bg-card p-5 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Financial Trajectory</h3>
                  <p className="text-[10px] text-muted-foreground">
                    Allocated vs. Utilized Capital (6M Cycle)
                  </p>
                </div>
                  <div className="flex gap-4 text-[10px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-primary" />
                    ALLOCATED
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-sky-500" />
                    UTILIZED
                  </div>
                </div>
              </div>

              <div className="flex flex-1 items-end justify-between gap-2 px-4 pb-2">
                {financial.map((m) => {
                  const alloc = (m.allocated / maxFinancial) * 100;
                  const util =
                    m.allocated > 0 ? (m.utilized / m.allocated) * 100 : 0;

                  return (
                    <div
                      key={`${m.month}-${m.year ?? ""}`}
                      className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
                      onMouseEnter={() => setHoveredMonth(`${m.month}-${m.year ?? ""}`)}
                      onMouseLeave={() => setHoveredMonth(null)}
                    >
                      <div
                        className="relative w-10 rounded-t bg-primary/10"
                        style={{ height: `${alloc}%` }}
                      >
                        <div
                          className="absolute bottom-0 w-full rounded-t bg-sky-500"
                          style={{ height: `${util}%` }}
                        />
                        {hoveredMonth === `${m.month}-${m.year ?? ""}` ? (
                          <div className="absolute -top-20 left-1/2 z-10 w-36 -translate-x-1/2 rounded bg-foreground px-3 py-2 text-[10px] font-bold text-background shadow-lg">
                            <p>{m.month} {m.year ?? ""}</p>
                            <p>Allocated: {formatPHP(m.allocated)}</p>
                            <p>Utilized: {formatPHP(m.utilized)}</p>
                          </div>
                        ) : null}
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {m.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="shrink-0 rounded border border-border/50 bg-card p-5 shadow-sm">
              <h3 className="mb-5 text-sm font-bold">Sector Impact Analysis</h3>
              <div className="grid grid-cols-1 gap-x-12 gap-y-4 md:grid-cols-2">
                {sectors.map((s) => (
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

          <div className="flex flex-col gap-6 xl:col-span-4">
            <div className="flex min-h-[280px] flex-1 flex-col rounded border border-border/50 bg-card p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-sm font-bold">Institutional Pulse</h3>
                <button
                  type="button"
                  onClick={() => void navigate({ to: "/audit" })}
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  AUDIT LOG
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto pr-2">
                {activity.map((evt, idx) => {
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
                      {idx < activity.length - 1 && (
                        <div className="absolute bottom-[-24px] left-[7px] top-4 w-px bg-border" />
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

                {!activity.length && (
                  <p className="text-sm text-muted-foreground">
                    No recent activity available.
                  </p>
                )}
              </div>
            </div>

            <div className="flex h-[280px] shrink-0 flex-col rounded border border-border/50 bg-card p-2 shadow-sm">
              <div className="px-3 py-2">
                <h3 className="text-xs font-bold">Spatial Distribution</h3>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Map Monitoring Preview
                </p>
              </div>

              <div className="m-1 relative flex-1 overflow-hidden rounded bg-muted">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-status-ongoing/5" />

                {markers.map((mk, index) => {
                  const { left, top } = markerPosition(mk.latitude, mk.longitude);

                  const tone =
                    mk.status === "delayed"
                      ? "bg-status-delayed"
                      : mk.status === "completed"
                        ? "bg-status-completed"
                        : "bg-primary";

                  return (
                    <div
                      key={mk.project_id}
                      className={`absolute h-2.5 w-2.5 rounded-full border-2 border-card shadow-lg ${
                        index === 0 ? "animate-pulse h-3 w-3" : ""
                      } ${tone}`}
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                      }}
                      title={mk.title}
                    />
                  );
                })}

                {!markers.length && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">
                      No mapped projects available.
                    </p>
                  </div>
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
    </AppShell>
  );
}
