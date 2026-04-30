import { useEffect, useMemo, useState } from "react";
import "@/styles/materialSymbols.css";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import IssueLogModal from "@/components/modals/IssueLogModal";
import ResolveIssueModal from "@/components/modals/ResolveIssueModal";
import {
  createIssue,
  getIssues,
  getIssueProjectOptions,
  resolveIssue,
  type CreateIssuePayload,
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
  status: ViewMode;
  resolvedDate?: string | null;
  projectId: string;
  projectTitle: string;
  category: string;
}

const severityFilters: Severity[] = ["Critical", "High", "Medium", "Low"];
const PAGE_SIZE = 5;
const ALL_SECTORS = "All Sectors";

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
    sector: project?.sector_name || "Unknown",
    reportedBy: issue.resolved_by || project?.project_title || "System",
    timestamp: issue.date_reported ? formatDateTime(issue.date_reported) : "—",
    status,
    resolvedDate: issue.resolved_date ?? null,
    projectId: issue.project_id,
    projectTitle: project?.project_title || "Untitled Project",
    category: issue.issue_category || "General",
  };
}

export default function Issues() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<IssueStatus>("Open");
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | "All">("All");
  const [selectedSector, setSelectedSector] = useState(ALL_SECTORS);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedResolveIssueId, setSelectedResolveIssueId] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const issuesQuery = useQuery({
    queryKey: ["issues", "all"],
    queryFn: () => getIssues(),
  });
  const projectsQuery = useQuery({
    queryKey: ["issues", "project-options"],
    queryFn: getIssueProjectOptions,
  });

  const createIssueMutation = useMutation({
    mutationFn: (payload: CreateIssuePayload) => createIssue(payload.project_id, {
      issue_name: payload.issue_name,
      issue_category: payload.issue_category,
      issue_description: payload.issue_description,
      date_reported: payload.date_reported,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
  const resolveIssueMutation = useMutation({
    mutationFn: (payload: {
      issue_id: string;
      corrective_action: string;
      resolved_date: string;
      resolved_by: string;
    }) =>
      resolveIssue(payload.issue_id, {
        corrective_action: payload.corrective_action,
        resolved_date: payload.resolved_date,
        resolved_by: payload.resolved_by,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
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
    const normalizedSearch = (searchTerm ?? "").trim().toLowerCase();

    return riskItems.filter((risk) => {
      const matchesView = risk.status === view;
      const matchesSearch =
        !normalizedSearch ||
        [risk.id, risk.title, risk.description, risk.sector, risk.reportedBy, risk.projectTitle, risk.category].some(
          (value) => String(value ?? "").toLowerCase().includes(normalizedSearch),
        );
      const matchesSeverity =
        selectedSeverity === "All" || risk.severity === selectedSeverity;
      const matchesSector =
        selectedSector === ALL_SECTORS || risk.sector === selectedSector;

      return matchesView && matchesSearch && matchesSeverity && matchesSector;
    });
  }, [riskItems, searchTerm, selectedSeverity, selectedSector, view]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedSeverity, selectedSector, view]);

  const sectorOptions = useMemo(() => {
    const sectors = Array.from(
      new Set(riskItems.map((risk) => risk.sector).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
    return [ALL_SECTORS, ...sectors];
  }, [riskItems]);

  const totalPages = Math.max(1, Math.ceil(filteredRisks.length / PAGE_SIZE));
  const visibleRisks = filteredRisks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = filteredRisks.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, filteredRisks.length);

  const openCount = riskItems.filter((risk) => risk.status === "Open").length;

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

    return { label: severity, value: `${percent.toFixed(0)}%`, color };
  });

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

  const resolveIssueOptions = useMemo(() => {
    const openIssues = issueItems.filter((issue) => issue.status === "Open");
    if (!selectedResolveIssueId) return openIssues;

    const selected = openIssues.find(
      (issue) => issue.issue_id === selectedResolveIssueId,
    );
    if (!selected) return openIssues;

    return [
      selected,
      ...openIssues.filter((issue) => issue.issue_id !== selectedResolveIssueId),
    ];
  }, [issueItems, selectedResolveIssueId]);

  const openResolveModal = (issueId: string) => {
    setSelectedResolveIssueId(issueId);
    setResolveError(null);
    setResolveModalOpen(true);
  };

  const handleResolveIssue = async (payload: {
    issue_id: string;
    corrective_action: string;
    resolved_date: string;
    resolved_by: string;
  }) => {
    try {
      setResolveError(null);
      await resolveIssueMutation.mutateAsync(payload);

      setResolveModalOpen(false);
      setSelectedResolveIssueId("");
    } catch (err) {
      setResolveError(err instanceof Error ? err.message : "Failed to resolve issue.");
    }
  };

  const handleCreateIssue = async (payload: CreateIssuePayload) => {
    try {
      setModalError(null);
      await createIssueMutation.mutateAsync(payload);
      setModalOpen(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Failed to save issue.");
    }
  };

  return (
    <AppShell>
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/90 px-6 backdrop-blur">
          <div className="hidden w-full max-w-md md:block">
            <label className="relative block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
                search
              </span>
              <input
                className="h-10 w-full rounded-lg border border-transparent bg-slate-100 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/20"
                placeholder="Search risks or projects..."
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-primary"
              type="button"
            >
              <span className="material-symbols-outlined text-xl">
                notifications
              </span>
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <button
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-primary"
              type="button"
            >
              <span className="material-symbols-outlined text-xl">help</span>
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-primary-container text-xs font-black text-on-primary-container">
              AU
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto px-5 py-6 lg:px-8">
          <div className="mx-auto flex max-w-[1220px] flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-muted-foreground">
                  Analytics / <span className="text-primary">Risk Management</span>
                </p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Issue & Risk Log
                </h1>
                <p className="mt-1 max-w-2xl text-sm font-medium text-muted-foreground">
                  Monitor project blockers, risk severity, and resolution status
                  across active implementation work.
                </p>
              </div>

              <button
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-xs font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-teal-600"
                type="button"
                onClick={() => setModalOpen(true)}
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Log New Risk
              </button>
            </div>

            <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm xl:flex-row xl:items-center">
              <div className="flex rounded-lg bg-slate-100 p-1">
                <button
                  className={`rounded-md px-4 py-2 text-[10px] font-black uppercase tracking-wider transition ${
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
                  className={`rounded-md px-4 py-2 text-[10px] font-black uppercase tracking-wider transition ${
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
                  Severity:
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
                    onClick={() => setSelectedSeverity(severity)}
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

            <div className="grid min-h-[610px] gap-5 xl:grid-cols-12">
              <section className="flex min-h-0 flex-col rounded-xl border border-border bg-card shadow-sm xl:col-span-8">
                <div className="flex items-center justify-between border-b border-border bg-white px-5 py-4">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-950">
                    Active Risk Feed
                  </h2>
                  <span className="rounded bg-red-50 px-2 py-1 text-[9px] font-black uppercase text-destructive">
                    {openCount} Open Issues
                  </span>
                </div>

                <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
                  {visibleRisks.map((risk) => (
                    <RiskRow key={risk.issueId} risk={risk} onResolve={openResolveModal} />
                  ))}
                  {!visibleRisks.length && (
                    <div className="flex h-56 items-center justify-center text-sm font-semibold text-muted-foreground">
                      No risks match the current filters.
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-border bg-slate-50/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
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

              <aside className="flex flex-col gap-5 xl:col-span-4">
                <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-950">
                      Risk Metrics
                    </h2>
                    <span className="material-symbols-outlined text-slate-400">
                      insights
                    </span>
                  </div>

                  <div className="border-b border-border pb-6">
                    <h3 className="mb-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      Severity Distribution
                    </h3>
                    <div className="flex items-center gap-6">
                      <div className="relative h-28 w-28 shrink-0">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18"
                            cy="18"
                            fill="transparent"
                            r="15.9"
                            stroke="#f1f5f9"
                            strokeWidth="4"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            fill="transparent"
                            r="15.9"
                            stroke="#ba1a1a"
                            strokeDasharray={`${severityDistribution[0]?.value ?? "0"} 100`}
                            strokeWidth="4"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            fill="transparent"
                            r="15.9"
                            stroke="#f97316"
                            strokeDasharray="35 100"
                            strokeDashoffset="-25"
                            strokeWidth="4"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            fill="transparent"
                            r="15.9"
                            stroke="#14b8a6"
                            strokeDasharray="40 100"
                            strokeDashoffset="-60"
                            strokeWidth="4"
                          />
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
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-5">
                    <div className="mb-4 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>Issues per Sector</span>
                      <span>Total: {riskItems.length}</span>
                    </div>
                    <div className="space-y-3">
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

                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-lg">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-primary">
                    Resolution Efficiency
                  </p>
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-black">84%</span>
                    <p className="mb-1 text-[10px] leading-tight text-slate-400">
                      Average risks resolved within established SLA this month.
                    </p>
                  </div>
                  <div className="mt-5 border-t border-slate-800 pt-4">
                    <button
                      className="w-full rounded-lg bg-slate-800 py-2 text-[9px] font-black uppercase tracking-widest transition hover:bg-slate-700"
                      type="button"
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

      <IssueLogModal
        open={modalOpen}
        projects={projectOptions}
        submitting={createIssueMutation.isPending}
        error={modalError}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setModalError(null);
        }}
        onSubmit={handleCreateIssue}
      />

      <ResolveIssueModal
        open={resolveModalOpen}
        issues={resolveIssueOptions}
        resolvedBy="Admin User"
        submitting={resolveIssueMutation.isPending}
        error={resolveError}
        onOpenChange={(open) => {
          setResolveModalOpen(open);
          if (!open) {
            setResolveError(null);
            setSelectedResolveIssueId("");
          }
        }}
        onSubmit={handleResolveIssue}
      />
    </AppShell>
  );
}

function RiskRow({
  risk,
  onResolve,
}: {
  risk: RiskItem;
  onResolve: (issueId: string) => void;
}) {
  const meta = severityMeta[risk.severity];

  return (
    <article
      className={`flex gap-4 p-4 transition hover:bg-slate-50 ${
        risk.status === "Resolved" ? "opacity-70" : ""
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.iconBox}`}
      >
        <span className={`material-symbols-outlined text-xl ${meta.iconText}`}>
          {risk.status === "Resolved" ? "check_circle" : meta.icon}
        </span>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase ${meta.badge}`}>
              {risk.severity}
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
              {risk.id}
            </span>
            <h3 className="truncate text-sm font-black text-slate-950">
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
              {risk.status}
            </span>
          </div>
        </div>

        <p className="line-clamp-2 text-[11px] leading-5 text-muted-foreground">
          {risk.description}
        </p>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[9px] font-bold text-muted-foreground">
            Project: <span className="text-slate-950">{risk.projectTitle}</span>
          </p>

          {risk.status === "Resolved" ? (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase text-teal-600">
              <span className="material-symbols-outlined text-xs">verified</span>
              Solved on {risk.resolvedDate || "—"}
            </span>
          ) : (
            <button
              className="flex items-center justify-center gap-1 rounded bg-primary px-3 py-1 text-[9px] font-black uppercase text-white transition hover:bg-teal-600"
              type="button"
              onClick={() => void onResolve(risk.issueId)}
            >
              <span className="material-symbols-outlined text-sm">
                check_circle
              </span>
              Solved
            </button>
          )}
        </div>
      </div>
    </article>
  );
}