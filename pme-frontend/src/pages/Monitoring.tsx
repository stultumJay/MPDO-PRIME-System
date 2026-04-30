import { useEffect, useMemo, useRef, useState } from "react";
import "@/styles/materialSymbols.css";
import { AppShell } from "../components/layout/AppShell";
import {
  formatPHP,
  getMonitoringData,
  type MonitoringPayload,
  type MonitoringProjectSummary,
} from "@/services/monitoring.service";

type KpiTone = "teal" | "blue" | "green" | "orange" | "violet";

interface KpiCard {
  label: string;
  value: string;
  icon: string;
  tone: KpiTone;
}

const PAGE_SIZE = 5;

const kpiToneClasses: Record<KpiTone, { box: string; text: string }> = {
  teal: { box: "bg-teal-50", text: "text-teal-600" },
  blue: { box: "bg-blue-50", text: "text-blue-600" },
  green: { box: "bg-emerald-50", text: "text-emerald-600" },
  orange: { box: "bg-orange-50", text: "text-orange-600" },
  violet: { box: "bg-violet-50", text: "text-violet-600" },
};

function getProgressTone(value: number) {
  if (value === 0) return "bg-slate-200 text-slate-400";
  if (value < 25) return "bg-destructive text-destructive";
  return "bg-primary text-slate-900";
}

function formatCompactPHP(amount: number) {
  if (amount >= 1_000_000) return `PHP ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `PHP ${(amount / 1_000).toFixed(1)}K`;
  return formatPHP(amount).replace("₱", "PHP ");
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Monitoring() {
  const [searchTerm, setSearchTerm] = useState("");
  const [payload, setPayload] = useState<MonitoringPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const loadedFiscalYearRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      selectedFiscalYear !== null &&
      loadedFiscalYearRef.current === selectedFiscalYear
    ) {
      return;
    }

    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getMonitoringData(selectedFiscalYear ?? undefined);
        if (!mounted) return;
        setPayload(data);
        loadedFiscalYearRef.current = data.fiscalYear;
        setSelectedFiscalYear((current) => current ?? data.fiscalYear);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load monitoring data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [selectedFiscalYear]);

  const projectSummaries = payload?.projectSummaries ?? [];

  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return projectSummaries;

    return projectSummaries.filter((project) =>
      [project.name, project.code, project.sector].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [searchTerm, projectSummaries]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleProjects = filteredProjects.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const exportMonitoringCsv = () => {
    const year = payload?.fiscalYear ?? new Date().getFullYear();
    const rows: (string | number)[][] = [
      ["Project Name", "Project Code", "Sector", "Total Budget", "Financial Utilization %", "Physical Completion %"],
      ...filteredProjects.map((project) => [
        project.name,
        project.code,
        project.sector,
        project.budget,
        project.financial,
        project.physical,
      ]),
    ];

    downloadCsv(`monthly_monitoring_fy_${year}.csv`, rows);
  };

  const kpis: KpiCard[] = payload
    ? [
        {
          label: "Total Projects",
          value: String(payload.kpis.totalProjects),
          icon: "folder",
          tone: "teal",
        },
        {
          label: "Active Projects",
          value: String(payload.kpis.activeProjects),
          icon: "pending_actions",
          tone: "blue",
        },
        {
          label: "Completed",
          value: String(payload.kpis.completed),
          icon: "check_circle",
          tone: "green",
        },
        {
          label: "Appropriated",
          value: formatCompactPHP(payload.kpis.appropriated),
          icon: "account_balance_wallet",
          tone: "orange",
        },
        {
          label: "Utilized (%)",
          value: `${payload.kpis.utilizedPercent.toFixed(1)}%`,
          icon: "query_stats",
          tone: "violet",
        },
      ]
    : [];

  return (
    <AppShell>
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/90 px-6 backdrop-blur">
          <div className="flex min-w-0 items-center gap-4">
            <h1 className="text-lg font-black tracking-tight text-slate-900">Project Monitoring</h1>
          </div>

          <div className="mx-6 hidden w-full max-w-xl md:block">
            <label className="relative block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
                search
              </span>
              <input
                ref={searchInputRef}
                className="h-10 w-full rounded-xl border border-transparent bg-slate-100 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/20"
                placeholder="Search analytics..."
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-primary" type="button">
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <button className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-primary" type="button">
              <span className="material-symbols-outlined text-xl">apps</span>
            </button>
            <div className="mx-2 hidden h-8 w-px bg-border sm:block" />
            <div className="hidden text-right sm:block">
              <p className="text-xs font-black leading-tight text-slate-900">Admin User</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Planning Officer
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-primary-container text-xs font-black text-on-primary-container">
              AU
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto px-5 py-6 lg:px-8">
          <div className="mx-auto flex max-w-[1220px] flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                  Analytics & Reporting {payload ? `· FY ${payload.fiscalYear}` : ""}
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Monthly Reporting Analytics
                </h2>
                <p className="mt-1 max-w-2xl text-sm font-medium text-muted-foreground">
                  Institutional performance tracking for the Municipal Planning and Development Office.
                </p>
              </div>

              <div className="flex w-full justify-start lg:w-auto lg:justify-end">
                <div className="grid w-full overflow-hidden rounded-lg bg-slate-100/90 sm:w-[360px] sm:grid-cols-[1fr_auto_1fr_auto]">
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <div>
                      <p className="text-[10px] font-black uppercase leading-none tracking-tight text-slate-500">Start Date</p>
                      <p className="mt-1 text-sm font-black tracking-tight text-slate-950">
                        {payload?.startDate ?? "--/--/----"}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-lg text-slate-500">calendar_today</span>
                  </div>
                  <div className="hidden w-px bg-border sm:block" />
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <div>
                      <p className="text-[10px] font-black uppercase leading-none tracking-tight text-slate-500">End Date</p>
                      <p className="mt-1 text-sm font-black tracking-tight text-slate-950">
                        {payload?.endDate ?? "--/--/----"}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-lg text-slate-500">calendar_today</span>
                  </div>
                  <label className="border-t border-border bg-white/50 px-3 py-2 sm:border-l sm:border-t-0">
                    <span className="sr-only">Fiscal year</span>
                    <select
                      className="h-full border-none bg-transparent p-0 text-xs font-black text-slate-950 outline-none focus:ring-0"
                      value={selectedFiscalYear ?? payload?.fiscalYear ?? ""}
                      onChange={(event) => {
                        setSelectedFiscalYear(Number(event.target.value));
                        setPage(1);
                      }}
                    >
                      {(payload?.fiscalYears ?? (payload ? [payload.fiscalYear] : [])).map((year) => (
                        <option key={year} value={year}>
                          FY {year}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground">
                Loading monitoring data...
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {kpis.map((kpi) => {
                const tone = kpiToneClasses[kpi.tone];

                return (
                  <article
                    className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
                    key={kpi.label}
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tone.box} ${tone.text}`}>
                      <span className="material-symbols-outlined text-2xl">{kpi.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {kpi.label}
                      </p>
                      <p className="mt-1 truncate text-xl font-black leading-none text-slate-950">{kpi.value}</p>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="grid gap-5 xl:grid-cols-12">
              <article className="rounded-2xl border border-border bg-card p-5 shadow-sm xl:col-span-4">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-tight text-slate-950">Status Distribution</h3>
                  <span className="material-symbols-outlined text-slate-400">pie_chart</span>
                </div>
                <div className="space-y-4">
                  {(payload?.statusDistribution ?? []).map((item) => (
                    <div className="space-y-1.5" key={item.label}>
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                        <span>
                          {item.label} ({item.count})
                        </span>
                        <span className={item.tone === "bg-destructive" ? "text-destructive" : "text-primary"}>
                          {item.percent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="flex min-h-[250px] flex-col rounded-2xl border border-border bg-card p-5 shadow-sm xl:col-span-8">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-sm font-black uppercase tracking-tight text-slate-950">Project Completion Trends</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-[10px] font-black uppercase text-muted-foreground">Actual</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-200" />
                      <span className="text-[10px] font-black uppercase text-muted-foreground">Target</span>
                    </div>
                  </div>
                </div>

                <div className="flex min-h-[175px] flex-1 items-end justify-between gap-4 px-1 pt-4">
                  {(payload?.completionTrends ?? []).map((trend) => (
                    <div className={`flex flex-1 flex-col items-center ${trend.future ? "opacity-40" : ""}`} key={trend.month}>
                      <div className="relative flex h-36 w-full items-end justify-center">
                        <div
                          className="absolute bottom-0 w-full max-w-[76px] rounded-t-lg bg-slate-100"
                          style={{ height: `${trend.target}%` }}
                        />
                        {!trend.future && (
                          <div
                            className="relative z-10 flex w-full max-w-[76px] items-end justify-center rounded-t-lg bg-primary/35"
                            style={{ height: `${Math.max(trend.actual, 28)}%` }}
                          >
                            <div
                              className="w-full rounded-t-lg bg-primary"
                              style={{ height: `${Math.max(trend.actual - 18, 18)}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <span
                        className={`mt-2 text-[10px] font-black ${trend.highlight ? "text-slate-950" : "text-slate-400"}`}
                      >
                        {trend.month}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <article className="min-h-[330px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-950">Project Monitoring Summary</h3>
                <div className="flex items-center gap-1">
                  <button
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-primary"
                    type="button"
                    title="Focus search"
                    onClick={() => searchInputRef.current?.focus()}
                  >
                    <span className="material-symbols-outlined text-lg">search</span>
                  </button>
                  <button
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-primary"
                    type="button"
                    title="Clear search filters"
                    onClick={() => setSearchTerm("")}
                  >
                    <span className="material-symbols-outlined text-lg">filter_list</span>
                  </button>
                  <button
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    title="Download monitoring summary"
                    disabled={!filteredProjects.length}
                    onClick={exportMonitoringCsv}
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <th className="px-5 py-3">Project Name</th>
                      <th className="px-5 py-3">Sector</th>
                      <th className="px-5 py-3">Total Budget</th>
                      <th className="px-5 py-3">Financial Util. (%)</th>
                      <th className="px-5 py-3">Physical Comp. (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleProjects.map((project: MonitoringProjectSummary) => {
                      const progressTone = getProgressTone(project.physical);
                      const progressClasses = progressTone.split(" ");

                      return (
                        <tr className="transition hover:bg-slate-50/80" key={project.code}>
                          <td className="px-5 py-4">
                            <p className="text-xs font-black text-slate-950">{project.name}</p>
                            <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{project.code}</p>
                          </td>
                          <td className="px-5 py-4 text-xs font-semibold text-slate-600">{project.sector}</td>
                          <td className="px-5 py-4 text-xs font-black text-slate-950">{project.budget}</td>
                          <td className="px-5 py-4 text-xs font-black text-teal-600">{project.financial}%</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full rounded-full ${progressClasses[0]}`}
                                  style={{ width: `${project.physical}%` }}
                                />
                              </div>
                              <span className={`text-[10px] font-black ${progressClasses[1]}`}>
                                {project.physical}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 bg-slate-50 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Showing {filteredProjects.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} to{" "}
                  {Math.min(currentPage * PAGE_SIZE, filteredProjects.length)} of {filteredProjects.length} projects
                </span>
                <div className="flex gap-4">
                  <button
                    className="transition hover:text-primary disabled:opacity-30"
                    disabled={currentPage === 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    type="button"
                  >
                    Previous
                  </button>
                  <button
                    className="transition hover:text-primary disabled:opacity-30"
                    disabled={currentPage >= pageCount}
                    onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                    type="button"
                  >
                    Next
                  </button>
                </div>
              </div>
            </article>
          </div>
        </main>
      </section>
    </AppShell>
  );
}