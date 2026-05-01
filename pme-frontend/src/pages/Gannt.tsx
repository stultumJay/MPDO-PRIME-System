import { useEffect, useMemo, useRef, useState } from "react";
import "@/styles/materialSymbols.css";
import { AppShell } from "../components/layout/AppShell";
import {
  getGanttData,
  type GanttPayload,
  type TimelineProject,
  type TimelineStatus,
} from "@/services/gantt.service";

interface StatusMeta {
  label: string;
  dot: string;
  track: string;
  fill: string;
  text: string;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fallbackYears = ["2026"];
const fallbackSectors = ["All Sectors"];
const statuses = ["All Status", "On Schedule", "Slight Delay", "Major Delay"];
const PAGE_SIZE = 10;
const ALL_SECTORS = "All Sectors";
const ALL_STATUS = "All Status";

const statusMeta: Record<TimelineStatus, StatusMeta> = {
  "On Schedule": {
    label: "On Schedule",
    dot: "bg-primary",
    track: "bg-primary-container/60 border-primary/30",
    fill: "from-teal-700 to-primary",
    text: "text-primary",
  },
  "Slight Delay": {
    label: "Slight Delay",
    dot: "bg-orange-400",
    track: "bg-orange-100 border-orange-200",
    fill: "from-orange-700 to-orange-400",
    text: "text-orange-500",
  },
  "Major Delay": {
    label: "Major Delay",
    dot: "bg-destructive",
    track: "bg-red-100 border-red-200",
    fill: "from-red-800 to-destructive",
    text: "text-destructive",
  },
};

function getSectorTone(sector: string) {
  if (sector === "Infrastructure") return "text-primary";
  if (sector === "Social") return "text-orange-500";
  if (sector === "Economic") return "text-blue-500";
  if (sector === "Environment") return "text-emerald-600";
  return "text-slate-500";
}

function getBarPosition(project: TimelineProject) {
  const left = ((project.startMonth - 1) / 12) * 100;
  const width = (project.duration / 12) * 100;
  return { left: `${left}%`, width: `${width}%` };
}

function normalizeFilter(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function findOptionByNormalized(options: string[], value: string) {
  const key = normalizeFilter(value);
  return options.find((option) => normalizeFilter(option) === key);
}

function isAllOption(value: string, allValue: string) {
  return normalizeFilter(value) === normalizeFilter(allValue);
}

export default function Gannt() {
  const [searchTerm, setSearchTerm] = useState("");
  const [payload, setPayload] = useState<GanttPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState(fallbackSectors[0]);
  const [selectedStatus, setSelectedStatus] = useState(statuses[0]);
  const [page, setPage] = useState(1);
  const loadedYearRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedYear !== null && loadedYearRef.current === selectedYear) return;

    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getGanttData(selectedYear ? Number(selectedYear) : undefined);
        if (!mounted) return;
        setPayload(data);
        loadedYearRef.current = String(data.fiscalYear);
        if (selectedYear === null) setSelectedYear(String(data.fiscalYear));
        setSelectedSector((current) =>
          findOptionByNormalized(data.sectors, current) ?? ALL_SECTORS,
        );
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load timeline data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [selectedYear]);

  const years = payload?.years ?? fallbackYears;
  const sectors = payload?.sectors ?? fallbackSectors;
  const timelineProjects = payload?.projects ?? [];

  useEffect(() => {
    const canonical = findOptionByNormalized(sectors, selectedSector);
    if (!canonical) setSelectedSector(ALL_SECTORS);
    else if (canonical !== selectedSector) setSelectedSector(canonical);
  }, [sectors, selectedSector]);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = normalizeFilter(searchTerm);
    const selectedSectorKey = normalizeFilter(selectedSector);
    const selectedStatusKey = normalizeFilter(selectedStatus);

    return timelineProjects.filter((project) => {
      const matchesSearch =
        !normalizedSearch ||
        [project.name, project.sector, project.status].some((value) =>
          normalizeFilter(value).includes(normalizedSearch),
        );
      const matchesSector =
        isAllOption(selectedSector, ALL_SECTORS) ||
        normalizeFilter(project.sector) === selectedSectorKey;
      const matchesStatus =
        isAllOption(selectedStatus, ALL_STATUS) ||
        normalizeFilter(project.status) === selectedStatusKey;

      return matchesSearch && matchesSector && matchesStatus;
    });
  }, [searchTerm, selectedSector, selectedStatus, timelineProjects]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedSector, selectedStatus, selectedYear]);

  const pageCount = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleProjects = filteredProjects.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const delayedCount = timelineProjects.filter((project) => project.status !== "On Schedule").length;
  const averageProgress = Math.round(
    timelineProjects.length
      ? timelineProjects.reduce((total, project) => total + project.progress, 0) / timelineProjects.length
      : 0,
  );

  return (
    <AppShell
      topbar={{
        title: "Gantt Chart",
        showSearch: true,
        searchValue: searchTerm,
        onSearchChange: setSearchTerm,
        searchPlaceholder: "Search projects...",
      }}
    >
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        <main className="min-h-0 flex-1 overflow-auto px-5 py-6 lg:px-8">
          <div className="mx-auto flex max-w-[1220px] flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                  Analytics & Reporting {payload ? `· FY ${payload.fiscalYear}` : ""}
                </p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Gantt Chart & Timeline
                </h1>
                <p className="mt-1 max-w-2xl text-sm font-medium text-muted-foreground">
                  Track project phase schedules, completion status, and delivery drift across the fiscal year.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <CompactSelect
                  label="Year"
                  value={selectedYear ?? String(payload?.fiscalYear ?? fallbackYears[0])}
                  options={years}
                  onChange={setSelectedYear}
                />
                <CompactSelect label="Sector" value={selectedSector || ALL_SECTORS} options={sectors} onChange={setSelectedSector} />
                <CompactSelect label="Status" value={selectedStatus} options={statuses} onChange={setSelectedStatus} />
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground">
                Loading timeline data...
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-3">
              <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Projects</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black leading-none text-slate-950">{timelineProjects.length}</span>
                  <span className="flex items-center gap-1 text-xs font-black text-primary">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    +4
                  </span>
                </div>
              </article>
              <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avg Progress</p>
                <div className="mt-2 flex items-center gap-4">
                  <span className="text-3xl font-black leading-none text-slate-950">{averageProgress}%</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${averageProgress}%` }} />
                  </div>
                </div>
              </article>
              <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delayed Tasks</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black leading-none text-destructive">
                    {String(delayedCount).padStart(2, "0")}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">Critical</span>
                </div>
              </article>
            </div>

            <section className="min-h-[580px] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-base font-black tracking-tight text-slate-950">Project Timeline Dashboard</h2>
                <div className="flex flex-wrap items-center gap-4">
                  {Object.values(statusMeta).map((item) => (
                    <div className="flex items-center gap-1.5" key={item.label}>
                      <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[1060px]">
                  <div className="grid grid-cols-[260px_1fr] border-b border-border bg-slate-50">
                    <div className="border-r border-border px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Project Name
                    </div>
                    <div className="grid grid-cols-12">
                      {months.map((month) => (
                        <div className="border-r border-slate-100 px-2 py-3 text-center text-[10px] font-black uppercase tracking-wide text-slate-400 last:border-r-0" key={month}>
                          {month}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {visibleProjects.map((project) => {
                      const meta = statusMeta[project.status];
                      const position = getBarPosition(project);

                      return (
                        <div className="grid min-h-[62px] grid-cols-[260px_1fr] transition hover:bg-slate-50" key={project.name}>
                          <div className="flex flex-col justify-center border-r border-border bg-white px-5">
                            <p className="truncate text-xs font-black text-slate-900">{project.name}</p>
                            <p className={`mt-0.5 text-[9px] font-black uppercase tracking-tight ${getSectorTone(project.sector)}`}>
                              {project.sector}
                            </p>
                          </div>
                          <div className="relative">
                            <div className="absolute inset-0 grid grid-cols-12">
                              {months.map((month) => (
                                <div className="border-r border-slate-100 last:border-r-0" key={`${project.name}-${month}`} />
                              ))}
                            </div>
                            <div
                              className={`absolute top-1/2 z-10 h-5 -translate-y-1/2 overflow-hidden rounded-full border ${meta.track}`}
                              style={position}
                            >
                              <div
                                className={`flex h-full items-center rounded-full bg-gradient-to-r ${meta.fill} px-2`}
                                style={{ width: `${project.progress}%` }}
                              >
                                <span className="whitespace-nowrap text-[8px] font-black text-white">
                                  {project.progress}% Complete
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] font-medium text-muted-foreground">
                  Showing{" "}
                  <span className="font-black text-slate-950">
                    {filteredProjects.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} to{" "}
                    {Math.min(currentPage * PAGE_SIZE, filteredProjects.length)}
                  </span>{" "}
                  of <span className="font-black text-slate-950">{filteredProjects.length}</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    className="rounded-md border border-border p-1 text-slate-600 transition hover:bg-slate-50 disabled:text-slate-400"
                    disabled={currentPage === 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    type="button"
                    aria-label="Previous timeline page"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <button className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[10px] font-black text-white" type="button">
                    {currentPage}
                  </button>
                  <span className="px-1 text-[10px] text-slate-400">/ {pageCount}</span>
                  <button
                    className="rounded-md border border-border p-1 text-slate-600 transition hover:bg-slate-50 disabled:text-slate-400"
                    disabled={currentPage >= pageCount}
                    onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                    type="button"
                    aria-label="Next timeline page"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </section>
    </AppShell>
  );
}

function CompactSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const selectedValue = findOptionByNormalized(options, value) ?? options[0] ?? "";

  return (
    <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <select
        className="border-none bg-transparent p-0 text-[11px] font-black text-slate-800 outline-none focus:ring-0"
        value={selectedValue}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
