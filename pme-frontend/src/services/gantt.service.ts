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

type ProjectSummaryResponse = {
  project_code: string;
  project_title: string;
  sector: string;
  status: string;
  allotted: number | string;
  disbursed: number | string;
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

export async function getGanttData(fiscalYearOverride?: number): Promise<GanttPayload> {
  const fiscalYearsRaw = await requestJson<number[]>("/aip/fiscal-years");
  const years = fiscalYearsRaw.map((year) => toNumber(year)).filter((year) => year > 0);
  const fiscalYear = fiscalYearOverride ?? (years.length > 0 ? Math.max(...years) : new Date().getFullYear());
  const rows = await requestJson<ProjectSummaryResponse>("/reports/projects-summary", {
    fiscal_year: fiscalYear,
  });

  const projects = rows.map((row, index) => {
    const allotted = toNumber(row.allotted);
    const disbursed = toNumber(row.disbursed);
    const progress = row.status === "completed" ? 100 : allotted > 0 ? Math.min(95, Math.round((disbursed / allotted) * 100)) : 0;
    const startMonth = (index % 8) + 1;

    return {
      name: row.project_title,
      sector: row.sector,
      status: timelineStatus(row.status, progress),
      startMonth,
      duration: Math.min(12 - startMonth + 1, 3 + (index % 7)),
      progress,
    };
  });

  return {
    fiscalYear,
    years: years.sort((a, b) => b - a).map((year) => String(year)),
    sectors: ["All Sectors", ...Array.from(new Set(projects.map((project) => project.sector))).sort()],
    projects,
  };
}
