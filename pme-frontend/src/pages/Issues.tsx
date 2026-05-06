import { useEffect, useMemo, useState } from "react";
import "@/styles/materialSymbols.css";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import {
  getIssues,
  getIssueProjectOptions,
  type IssueItem,
  type IssueProjectOption,
  type IssueStatus,
} from "@/services/issues.service";
import { formatDateTime } from "@/lib/format";

type Severity = "Critical" | "High" | "Medium" | "Low";
type ViewMode = "Open" | "Resolved";

interface SeverityMeta {
  icon: string;
  badge: string;
  iconBox: string;
  iconText: string;
}

interface RiskItem {
  issueId: string;
  id: string;
  title: string;
  description: string;
  severity: Severity;
  sector: string;
  reportedBy: string;
  timestamp: string;
  sortDate: string;
  status: ViewMode;
  resolvedDate?: string | null;
  projectId: string;
  projectTitle: string;
  category: string;
}

const severityFilters: Severity[] = ["Critical", "High", "Medium", "Low"];
const PAGE_SIZE = 7;
const ALL_SECTORS = "All Sectors";
const SLA_DAYS = 30;
const severityRank: Record<Severity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

const severityMeta: Record<Severity, SeverityMeta> = {
  Critical: {
    icon: "report",
    badge: "bg-destructive text-white",
    iconBox: "bg-red-50",
    iconText: "text-destructive",
  },
  High: {
    icon: "warning",
    badge: "bg-orange-500 text-white",
    iconBox: "bg-orange-50",
    iconText: "text-orange-500",
  },
  Medium: {
    icon: "info",
    badge: "bg-primary text-white",
    iconBox: "bg-primary-container",
    iconText: "text-primary",
  },
  Low: {
    icon: "check_circle",
    badge: "bg-slate-400 text-white",
    iconBox: "bg-slate-100",
    iconText: "text-slate-400",
  },
};

function normalizeSeverity(value: unknown): Severity {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "critical") return "Critical";
  if (v === "high") return "High";
  if (v === "medium") return "Medium";
  if (v === "low") return "Low";
  return "Medium";
}

function normalizeViewStatus(value: IssueItem["status"]): ViewMode {
  return String(value).toLowerCase() === "resolved" ? "Resolved" : "Open";
}

function normalizeFilter(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function csvCell(value: string | number) {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function daysBetween(start?: string | null, end?: string | null) {
  if (!start || !end) return null;
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  return Math.max(0, Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000));
}

function toRiskItem(
  issue: IssueItem,
  projectMap: Map<string, IssueProjectOption>,
): RiskItem {
  const project = projectMap.get(issue.project_id);
  const severity = normalizeSeverity(issue.issue_category);
  const status = normalizeViewStatus(issue.status);

  return {
    issueId: issue.issue_id,
    id: issue.issue_id ? issue.issue_id.slice(0, 8).toUpperCase() : "N/A",
    title: issue.issue_name || "Untitled issue",
    description: issue.issue_description || "",
    severity,
    sector: issue.sector_name || project?.sector_name || "Unknown",
    reportedBy: issue.resolved_by || project?.project_title || "System",
    timestamp: issue.date_reported ? formatDateTime(issue.date_reported) : "—",
    sortDate: issue.date_reported ?? "",
    status,
    resolvedDate: issue.resolved_date ?? null,
    projectId: issue.project_id,
    projectTitle: project?.project_title || "Untitled Project",
    category: issue.issue_category || "General",
  };
}

export default function Issues() {
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<IssueStatus>("Open");
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | "All">("All");
  const [selectedSector, setSelectedSector] = useState(ALL_SECTORS);
  const [page, setPage] = useState(1);

  const issuesQuery = useQuery({
    queryKey: ["issues", "all"],
    queryFn: () => getIssues(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const projectsQuery = useQuery({
    queryKey: ["issues", "project-options"],
    queryFn: getIssueProjectOptions,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const issueItems = issuesQuery.data ?? [];
  const projectOptions = projectsQuery.data ?? [];
  const loading = issuesQuery.isLoading || projectsQuery.isLoading;
  const error =
    (issuesQuery.error instanceof Error && issuesQuery.error.message) ||
    (projectsQuery.error instanceof Error && projectsQuery.error.message) ||
    null;

  const riskItems = useMemo(() => {
    const projectMap = new Map(projectOptions.map((project) => [project.project_id, project]));
    return issueItems.map((issue) => toRiskItem(issue, projectMap));
  }, [issueItems, projectOptions]);

  const filteredRisks = useMemo(() => {
    const normalizedSearch = normalizeFilter(searchTerm);
    const selectedSectorKey = normalizeFilter(selectedSector);

    const filtered = riskItems.filter((risk) => {
      const matchesView = risk.status === view;
      const matchesSeverity =
        selectedSeverity === "All" ||
        normalizeFilter(risk.severity) === normalizeFilter(selectedSeverity);
      const matchesSearch =
        !normalizedSearch ||
        [risk.id, risk.title, risk.description, risk.sector, risk.reportedBy, risk.projectTitle, risk.category].some(
          (value) => normalizeFilter(value).includes(normalizedSearch),
        );
      const matchesSector =
        normalizeFilter(selectedSector) === normalizeFilter(ALL_SECTORS) ||
        normalizeFilter(risk.sector) === selectedSectorKey;

      return matchesView && matchesSeverity && matchesSearch && matchesSector;
    });

    return filtered.sort((a, b) => {
      const severityDelta = severityRank[a.severity] - severityRank[b.severity];
      if (severityDelta !== 0) return severityDelta;
      return new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime();
    });
  }, [riskItems, searchTerm, selectedSeverity, selectedSector, view]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedSeverity, selectedSector, view]);

  const sectorOptions = useMemo(() => {
    const sectors = Array.from(
      new Set(riskItems.map((risk) => risk.sector).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return [ALL_SECTORS, ...sectors];
  }, [riskItems]);

  const totalPages = Math.max(1, Math.ceil(filteredRisks.length / PAGE_SIZE));
  const visibleRisks = filteredRisks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = filteredRisks.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, filteredRisks.length);

  const openCount = riskItems.filter((risk) => risk.status === "Open").length;

  const exportRiskReport = () => {
    downloadCsv("issue-risk-report.csv", [
      ["Issue ID", "Severity", "Status", "Project", "Sector", "Title", "Description", "Reported", "Resolved Date"],
      ...filteredRisks.map((risk) => [
        risk.id,
        risk.severity,
        risk.status,
        risk.projectTitle,
        risk.sector,
        risk.title,
        risk.description,
        risk.timestamp,
        risk.resolvedDate ?? "",
      ]),
    ]);
  };

  const severityDistribution = severityFilters.map((severity) => {
    const count = riskItems.filter((risk) => risk.severity === severity).length;
    const percent = riskItems.length ? (count / riskItems.length) * 100 : 0;
    const color =
      severity === "Critical"
        ? "bg-destructive"
        : severity === "High"
          ? "bg-orange-500"
          : severity === "Medium"
            ? "bg-primary"
            : "bg-slate-400";

    return { label: severity, count, percent, color };
  });
  const severitySlices = severityDistribution.reduce<
    Array<(typeof severityDistribution)[number] & { offset: number }>
  >((items, item) => {
    const offset = items.reduce((sum, slice) => sum + slice.percent, 0);
    return [...items, { ...item, offset }];
  }, []);

  const sectorBreakdown = Array.from(new Set(riskItems.map((risk) => risk.sector))).map(
    (sector) => {
      const count = riskItems.filter((risk) => risk.sector === sector).length;
      return {
        label: sector,
        value: count,
        percent: riskItems.length ? (count / riskItems.length) * 100 : 0,
      };
    },
  );
  const resolvedRisks = riskItems.filter((risk) => risk.status === "Resolved");
  const resolvedDurations = resolvedRisks
    .map((risk) => daysBetween(risk.sortDate, risk.resolvedDate))
    .filter((days): days is number => days !== null);
  const onTimeResolved = resolvedRisks.filter((risk) => {
    const days = daysBetween(risk.sortDate, risk.resolvedDate);
    return days !== null && days <= SLA_DAYS;
  }).length;
  const resolutionEfficiency = resolvedRisks.length
    ? (onTimeResolved / resolvedRisks.length) * 100
    : 0;
  const averageResolutionDays = resolvedDurations.length
    ? resolvedDurations.reduce((sum, days) => sum + days, 0) / resolvedDurations.length
    : 0;

  return (
    <AppShell
      topbar={{
        title: "Issue & Risk Log",
        showSearch: true,
        searchValue: searchTerm,
        onSearchChange: setSearchTerm,
        searchPlaceholder: "Search risks or projects...",
      }}
    >
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        <main className="min-h-0 flex-1 overflow-hidden px-4 py-3 lg:px-5">
          <div className="mx-auto flex h-full max-w-[1220px] flex-col gap-2.5">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-muted-foreground">
                  Analytics / <span className="text-primary">Risk Management</span>
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                  Issue & Risk Log
                </h1>
                <p className="mt-0.5 max-w-2xl text-xs font-medium text-muted-foreground">
                  Monitor project blockers, risk severity, and resolution status
                  across active implementation work.
                </p>
              </div>

            </div>

            <section className="flex flex-col gap-2 rounded-lg border border-border bg-card p-2 shadow-sm xl:flex-row xl:items-center">
              <div className="flex rounded-lg bg-slate-100 p-1">
                <button
                    className={`rounded-md px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
                    view === "Open"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-muted-foreground hover:text-slate-950"
                  }`}
                  type="button"
                  onClick={() => setView("Open")}
                >
                  Open Issues
                </button>
                <button
                    className={`rounded-md px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
                    view === "Resolved"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-muted-foreground hover:text-slate-950"
                  }`}
                  type="button"
                  onClick={() => setView("Resolved")}
                >
                  Completed
                </button>
              </div>

              <div className="hidden h-7 w-px bg-border xl:block" />

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  Prioritize:
                </span>
                {severityFilters.map((severity) => (
                  <button
                    className={`rounded border px-2.5 py-1 text-[9px] font-black uppercase transition ${
                      selectedSeverity === severity
                        ? `${severityMeta[severity].badge} border-transparent`
                        : "border-border bg-slate-50 text-slate-500 hover:border-primary/30 hover:text-primary"
                    }`}
                    key={severity}
                    type="button"
                    onClick={() => setSelectedSeverity((current) => (current === severity ? "All" : severity))}
                  >
                    {severity}
                  </button>
                ))}
                <button
                  className={`rounded border px-2.5 py-1 text-[9px] font-black uppercase transition ${
                    selectedSeverity === "All"
                      ? "border-transparent bg-foreground text-background"
                      : "border-border bg-slate-50 text-slate-500 hover:border-primary/30 hover:text-primary"
                  }`}
                  type="button"
                  onClick={() => setSelectedSeverity("All")}
                >
                  All
                </button>
              </div>

              <div className="hidden h-7 w-px bg-border xl:block" />

              <select
                className="h-9 rounded-lg border border-border bg-slate-50 px-3 text-[10px] font-black uppercase text-muted-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                value={selectedSector}
                onChange={(event) => setSelectedSector(event.target.value)}
              >
                {sectorOptions.map((sector) => (
                  <option key={sector}>{sector}</option>
                ))}
              </select>

              <button
                className="text-left text-[9px] font-black uppercase tracking-wider text-primary transition hover:underline xl:ml-auto"
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSeverity("All");
                  setSelectedSector(ALL_SECTORS);
                  setView("Open");
                }}
              >
                x Clear All
              </button>
            </section>

            {error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground">
                Loading issue log...
              </div>
            ) : null}

            <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-12">
              <section className="flex min-h-0 flex-col rounded-xl border border-border bg-card shadow-sm xl:col-span-8">
                <div className="flex items-center justify-between border-b border-border bg-white px-4 py-2.5">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-950">
                    Active Risk Feed
                  </h2>
                  <span className="rounded bg-red-50 px-2 py-1 text-[9px] font-black uppercase text-destructive">
                    {openCount} Open Issues
                  </span>
                </div>

                <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
                  {visibleRisks.map((risk) => (
                    <RiskRow key={risk.issueId} risk={risk} />
                  ))}
                  {!visibleRisks.length && (
                    <div className="flex h-56 items-center justify-center text-sm font-semibold text-muted-foreground">
                      No risks match the current filters.
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-border bg-slate-50/70 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    Showing {rangeStart}-{rangeEnd} of {filteredRisks.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded border border-border text-slate-400 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      <span className="material-symbols-outlined text-lg">
                        chevron_left
                      </span>
                    </button>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded bg-primary text-[10px] font-black text-white"
                      type="button"
                    >
                      {page}
                    </button>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded border border-border text-slate-600 transition hover:bg-white"
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    >
                      <span className="material-symbols-outlined text-lg">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>
              </section>

              <aside className="flex flex-col gap-3 xl:col-span-4">
                <section className="rounded-xl border border-border bg-card p-3 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-950">
                      Risk Metrics
                    </h2>
                    <span className="material-symbols-outlined text-slate-400">
                      insights
                    </span>
                  </div>

                  <div className="border-b border-border pb-3">
                    <h3 className="mb-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      Severity Distribution
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 shrink-0">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18"
                            cy="18"
                            fill="transparent"
                            r="15.9"
                            stroke="#f1f5f9"
                            strokeWidth="4"
                          />
                          {severitySlices.map((item) => (
                            <circle
                              key={item.label}
                              cx="18"
                              cy="18"
                              fill="transparent"
                              r="15.9"
                              stroke={
                                item.label === "Critical"
                                  ? "#ba1a1a"
                                  : item.label === "High"
                                    ? "#f97316"
                                    : item.label === "Medium"
                                      ? "#14b8a6"
                                      : "#94a3b8"
                              }
                              strokeDasharray={`${item.percent} ${100 - item.percent}`}
                              strokeDashoffset={`${-item.offset}`}
                              strokeWidth="4"
                            />
                          ))}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-black text-slate-950">
                            {openCount}
                          </span>
                          <span className="text-[7px] font-black uppercase text-muted-foreground">
                            Open
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        {severityDistribution.map((item) => (
                          <div
                            className="flex items-center justify-between"
                            key={item.label}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${item.color}`} />
                              <span className="text-[10px] font-bold text-slate-950">
                                {item.label}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              {item.count} ({item.percent.toFixed(0)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3">
                    <div className="mb-2 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>Issues per Sector</span>
                      <span>Total: {riskItems.length}</span>
                    </div>
                    <div className="space-y-2">
                      {sectorBreakdown.map((sector) => (
                        <div key={sector.label}>
                          <div className="mb-1 flex justify-between text-[10px] font-bold">
                            <span className="text-slate-950">{sector.label}</span>
                            <span className="text-muted-foreground">
                              {sector.value}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${sector.percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="rounded-xl bg-slate-950 p-3 text-white shadow-lg">
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                    Resolution Efficiency
                  </p>
                  <div className="flex items-end gap-3">
                    <span className="text-3xl font-black">{resolutionEfficiency.toFixed(0)}%</span>
                    <p className="mb-1 text-[10px] leading-tight text-slate-400">
                      {onTimeResolved} of {resolvedRisks.length} resolved issues closed within {SLA_DAYS} days.
                    </p>
                  </div>
                  <p className="mt-2 text-[10px] font-semibold text-slate-400">
                    Avg. closed issue resolution time: {averageResolutionDays.toFixed(1)} days.
                  </p>
                  <div className="mt-3 border-t border-slate-800 pt-3">
                    <button
                      className="w-full rounded-lg bg-slate-800 py-2 text-[9px] font-black uppercase tracking-widest transition hover:bg-slate-700"
                      type="button"
                      onClick={exportRiskReport}
                    >
                      Download Risk Report
                    </button>
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </main>
      </section>

    </AppShell>
  );
}

function RiskRow({
  risk,
}: {
  risk: RiskItem;
}) {
  const meta = severityMeta[risk.severity];

  return (
    <article
      className={`flex gap-3 px-4 py-2 transition hover:bg-slate-50 ${
        risk.status === "Resolved" ? "opacity-70" : ""
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.iconBox}`}
      >
        <span className={`material-symbols-outlined text-lg ${meta.iconText}`}>
          {risk.status === "Resolved" ? "check_circle" : meta.icon}
        </span>
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-col gap-1 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase ${meta.badge}`}>
              {risk.severity}
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
              {risk.id}
            </span>
            <h3 className="truncate text-xs font-black text-slate-950">
              {risk.title}
            </h3>
          </div>

          <div className="shrink-0 text-left lg:text-right">
            <p className="text-[9px] font-medium text-muted-foreground">
              {risk.timestamp}
            </p>
            <span
              className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase ${
                risk.status === "Resolved"
                  ? "bg-teal-50 text-teal-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {risk.status === "Resolved" ? "Solved" : "Open"}
            </span>
          </div>
        </div>

        <p className="line-clamp-1 text-[11px] leading-4 text-slate-600">
          {risk.description}
        </p>

        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[9px] font-bold text-muted-foreground">
            Project: <span className="text-slate-950">{risk.projectTitle}</span>
          </p>

          {risk.status === "Resolved" ? (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase text-teal-600">
              <span className="material-symbols-outlined text-xs">verified</span>
              Solved on {risk.resolvedDate || "—"}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-700">
              <span className="material-symbols-outlined text-xs">radio_button_unchecked</span>
              Open
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
