import { apiRequest, withQuery } from "./api";

function buildUrl(path: string, query?: Record<string, string | number | null | undefined>) {
  const endpoint = path.startsWith("/") ? path : `/${path}`;
  return withQuery(endpoint, query);
}

async function requestJson<T>(path: string, query?: Record<string, string | number | null | undefined>) {
  return apiRequest<T>(buildUrl(path, query));
}

function toNumber(value: unknown, fallback = 0) {
  const n = typeof value === "string" ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toLabel(value: unknown, fallback: string) {
  const label = String(value ?? "").trim().replace(/\s+/g, " ");
  return label || fallback;
}

function uniqueSortedLabels(values: string[]) {
  const byKey = new Map<string, string>();

  for (const value of values) {
    const label = toLabel(value, "Unassigned");
    const key = label.toLowerCase();
    if (!byKey.has(key)) byKey.set(key, label);
  }

  return [...byKey.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

type ProjectSummaryResponse = {
  project_code: string;
  project_title: string;
  sector: string;
  status: string;
  allotted: number | string;
  disbursed: number | string;
}[];

type ProjectListResponse = {
  project_code: string;
  fiscal_year: number | string;
  expected_start_date?: string | null;
  expected_end_date?: string | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
}[];

export type TimelineStatus = "On Schedule" | "Slight Delay" | "Major Delay";

export interface TimelineProject {
  name: string;
  sector: string;
  status: TimelineStatus;
  startMonth: number;
  duration: number;
  progress: number;
}

export interface GanttPayload {
  fiscalYear: number;
  years: string[];
  sectors: string[];
  projects: TimelineProject[];
}

function timelineStatus(status: string, progress: number): TimelineStatus {
  if (status === "delayed" || progress < 25) return "Major Delay";
  if (progress < 55) return "Slight Delay";
  return "On Schedule";
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function schedulePosition(
  row: ProjectListResponse[number] | undefined,
  fallbackIndex: number,
  fiscalYear: number,
) {
  const start = parseDate(row?.actual_start_date) ?? parseDate(row?.expected_start_date);
  const end = parseDate(row?.actual_end_date) ?? parseDate(row?.expected_end_date);

  if (!start || !end) {
    const startMonth = (fallbackIndex % 8) + 1;
    return {
      startMonth,
      duration: Math.min(12 - startMonth + 1, 3 + (fallbackIndex % 7)),
    };
  }

  const fiscalStart = new Date(fiscalYear, 0, 1);
  const fiscalEnd = new Date(fiscalYear, 11, 31);
  const boundedStart = start < fiscalStart ? fiscalStart : start;
  const boundedEnd = end > fiscalEnd ? fiscalEnd : end;
  const startMonth = boundedStart.getMonth() + 1;
  const endMonth = Math.max(startMonth, boundedEnd.getMonth() + 1);

  return {
    startMonth,
    duration: Math.max(1, endMonth - startMonth + 1),
  };
}

export async function getGanttData(fiscalYearOverride?: number): Promise<GanttPayload> {
  const fiscalYearsRaw = await requestJson<number[]>("/aip/fiscal-years");
  const years = fiscalYearsRaw.map((year) => toNumber(year)).filter((year) => year > 0);
  const fiscalYear = fiscalYearOverride ?? (years.length > 0 ? Math.max(...years) : new Date().getFullYear());
  const [rows, projectRows] = await Promise.all([
    requestJson<ProjectSummaryResponse>("/reports/projects-summary", {
      fiscal_year: fiscalYear,
    }),
    requestJson<ProjectListResponse>("/projects/", {
      page: 1,
      size: 500,
    }),
  ]);
  const projectScheduleByCode = new Map(
    projectRows
      .filter((row) => toNumber(row.fiscal_year) === fiscalYear)
      .map((row) => [row.project_code, row]),
  );

  const projects = rows.map((row, index) => {
    const allotted = toNumber(row.allotted);
    const disbursed = toNumber(row.disbursed);
    const progress = row.status === "completed" ? 100 : allotted > 0 ? Math.min(95, Math.round((disbursed / allotted) * 100)) : 0;
    const schedule = schedulePosition(projectScheduleByCode.get(row.project_code), index, fiscalYear);

    return {
      name: row.project_title,
      sector: toLabel(row.sector, "Unassigned"),
      status: timelineStatus(row.status, progress),
      startMonth: schedule.startMonth,
      duration: schedule.duration,
      progress,
    };
  });

  return {
    fiscalYear,
    years: years.sort((a, b) => b - a).map((year) => String(year)),
    sectors: ["All Sectors", ...uniqueSortedLabels(projects.map((project) => project.sector))],
    projects,
  };
}
