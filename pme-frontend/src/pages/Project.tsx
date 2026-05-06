import { useEffect, useMemo, useState } from "react";
import "@/styles/materialSymbols.css";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import {
  getProjects,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_TONE,
  type ProjectListItem,
  type ProjectListPayload,
  type ProjectStatus,
} from "@/services/project.service";

const STATUS_FILTERS: (ProjectStatus | "all")[] = [
  "all",
  "planned",
  "in_progress",
  "completed",
  "delayed",
];

const PAGE_SIZE = 10;

export default function ProjectPage() {
  const [data, setData] = useState<ProjectListPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [page, setPage] = useState(1);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getProjects({ size: 500 });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];

    const q = query.trim().toLowerCase();

    return data.items.filter((p) => {
      if (sectorFilter !== "all" && p.sector_name !== sectorFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;

      return (
        p.project_title.toLowerCase().includes(q) ||
        p.project_code.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.sector_name.toLowerCase().includes(q)
      );
    });
  }, [data, query, sectorFilter, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [query, sectorFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleProjects = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-sm text-muted-foreground">Loading projects...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold">Projects failed to load</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => void loadProjects()}
            className="mt-4 rounded bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const payload = data as ProjectListPayload;

  return (
    <AppShell>
      <Topbar title="Find Projects" />

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <header className="flex items-center justify-between">
          <div>
            <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
              Project Management
            </span>
            <h1 className="text-2xl font-black tracking-tight">Find Projects</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Showing {filtered.length} of {payload.total} projects
            </p>
          </div>

          <button
            onClick={() => void loadProjects()}
            className="flex items-center gap-2 rounded bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Refresh
          </button>
        </header>

        {error ? (
          <div className="rounded border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 rounded border border-border/50 bg-card p-4 shadow-sm">
          <div className="relative min-w-[220px] flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground">
              search
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, code, or location…"
              className="w-full rounded bg-muted py-2 pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="rounded bg-muted px-3 py-2 text-xs font-medium outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Sectors</option>
            {payload.sectors.map((s) => (
              <option key={s.sector_id} value={s.sector_name}>
                {s.sector_name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ProjectStatus | "all")
            }
            className="rounded bg-muted px-3 py-2 text-xs font-medium outline-none focus:ring-1 focus:ring-primary"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Statuses" : PROJECT_STATUS_LABEL[s]}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setQuery("");
              setSectorFilter("all");
              setStatusFilter("all");
            }}
            className="px-3 py-2 text-[10px] font-bold uppercase text-muted-foreground hover:text-foreground"
          >
            Reset
          </button>
        </div>

        <div className="overflow-hidden rounded border border-border/50 bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Project Title</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Sector</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No projects match the current filters.
                    </td>
                  </tr>
                ) : (
                  visibleProjects.map((p) => <ProjectRow key={p.project_id} p={p} />)
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-border/50 bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-border bg-card px-3 py-1.5 text-[10px] font-bold uppercase text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <span className="rounded bg-primary px-3 py-1.5 text-[10px] font-black text-primary-foreground">
                {currentPage} / {pageCount}
              </span>
              <button
                disabled={currentPage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="rounded border border-border bg-card px-3 py-1.5 text-[10px] font-bold uppercase text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ProjectRow({ p }: { p: ProjectListItem }) {
  return (
    <tr className="border-t border-border/50 transition-colors hover:bg-muted/40">
      <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">
        {p.project_code}
      </td>
      <td className="px-4 py-3 font-bold text-foreground">
        <a
          href={`/projects/${p.project_id}`}
          className="transition-colors hover:text-primary"
        >
          {p.project_title}
        </a>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{p.location}</td>
      <td className="px-4 py-3">{p.sector_name}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${PROJECT_STATUS_TONE[p.status]}`}
        >
          {PROJECT_STATUS_LABEL[p.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <a
          href={`/projects/${p.project_id}`}
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-primary hover:underline"
        >
          View
          <span className="material-symbols-outlined text-sm">
            arrow_forward
          </span>
        </a>
      </td>
    </tr>
  );
}
