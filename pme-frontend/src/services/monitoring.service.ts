import { apiRequest, withQuery } from "./api";

function buildUrl(
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>,
) {
  const endpoint = path.startsWith("/") ? path : `/${path}`;
  return withQuery(endpoint, query);
}

async function requestJson<T>(
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>,
): Promise<T> {
  return apiRequest<T>(buildUrl(path, query));
}

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "string" ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function titleStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

type SummaryResponse = {
  total_projects?: number;
  completed?: number;
  delayed?: number;
  utilization_percent?: number;
  funds_utilized_amount?: number;
};

type StatusResponse = {
  status: string;
  count: number;
  percentage: number;
}[];

type TrendResponse = {
  month: string;
  year?: number;
  allocated: number | string;
  utilized: number | string;
}[];

type ProjectSummaryResponse = {
  project_code: string;
  project_title: string;
  sector: string;
  status: string;
  proposed: number | string;
  allotted: number | string;
  obligated: number | string;
  disbursed: number | string;
}[];

export interface MonitoringStatusItem {
  label: string;
  count: string;
  percent: number;
  tone: string;
}

export interface MonitoringTrendItem {
  month: string;
  target: number;
  actual: number;
  highlight?: boolean;
  future?: boolean;
}

export interface MonitoringProjectSummary {
  name: string;
  code: string;
  sector: string;
  budget: string;
  financial: number;
  physical: number;
}

export interface MonitoringPayload {
  fiscalYear: number;
  fiscalYears: number[];
  startDate: string;
  endDate: string;
  kpis: {
    totalProjects: number;
    activeProjects: number;
    completed: number;
    appropriated: number;
    utilizedPercent: number;
  };
  statusDistribution: MonitoringStatusItem[];
  completionTrends: MonitoringTrendItem[];
  projectSummaries: MonitoringProjectSummary[];
}

const statusTone: Record<string, string> = {
  completed: "bg-primary",
  in_progress: "bg-teal-400",
  ongoing: "bg-teal-400",
  planned: "bg-slate-400",
  delayed: "bg-destructive",
};

export async function getMonitoringData(fiscalYearOverride?: number): Promise<MonitoringPayload> {
  const fiscalYears = await requestJson<number[]>("/aip/fiscal-years");
  const fiscalYear =
    fiscalYearOverride ??
    (fiscalYears.length > 0 ? Math.max(...fiscalYears.map((year) => toNumber(year))) : new Date().getFullYear());

  const [summary, statuses, trends, projects] = await Promise.all([
    requestJson<SummaryResponse>("/dashboard/summary", { fiscal_year: fiscalYear }),
    requestJson<StatusResponse>("/analytics/project-status", { fiscal_year: fiscalYear }),
    requestJson<TrendResponse>("/dashboard/allocation-vs-disbursement", { months: 6 }),
    requestJson<ProjectSummaryResponse>("/reports/projects-summary", { fiscal_year: fiscalYear }),
  ]);

  const totalProjects = projects.length || toNumber(summary.total_projects);
  const activeProjects = projects.filter((project) =>
    ["in_progress", "ongoing", "active"].includes(project.status),
  ).length;
  const completed = projects.filter((project) => project.status === "completed").length || toNumber(summary.completed);
  const appropriated = projects.reduce((sum, project) => sum + toNumber(project.proposed), 0);
  const utilized = projects.reduce((sum, project) => sum + toNumber(project.disbursed), 0);
  const allotted = projects.reduce((sum, project) => sum + toNumber(project.allotted), 0);
  const utilizedPercent = allotted > 0 ? (utilized / allotted) * 100 : toNumber(summary.utilization_percent);

  const knownStatus = new Map(statuses.map((item) => [item.status, item]));
  const orderedStatuses = ["completed", "in_progress", "planned", "delayed"];
  const statusDistribution = orderedStatuses
    .map((status) => {
      const fromBackend = knownStatus.get(status);
      const count = fromBackend?.count ?? projects.filter((project) => project.status === status).length;
      const percent = totalProjects > 0 ? (count / totalProjects) * 100 : toNumber(fromBackend?.percentage);

      return {
        label: status === "in_progress" ? "Ongoing" : titleStatus(status),
        count: String(count).padStart(2, "0"),
        percent,
        tone: statusTone[status] ?? "bg-slate-400",
      };
    })
    .filter((item) => item.count !== "00" || ["Planned", "Delayed"].includes(item.label));

  const maxTrendValue = Math.max(
    ...trends.flatMap((trend) => [toNumber(trend.allocated), toNumber(trend.utilized)]),
    1,
  );

  const completionTrends = trends.map((trend, index) => ({
    month: trend.month.toUpperCase(),
    target: Math.max(8, (toNumber(trend.allocated) / maxTrendValue) * 100),
    actual: Math.max(0, (toNumber(trend.utilized) / maxTrendValue) * 100),
    highlight: index === trends.length - 1,
  }));

  const projectSummaries = projects.map((project) => {
    const proposed = toNumber(project.proposed);
    const allottedAmount = toNumber(project.allotted);
    const disbursedAmount = toNumber(project.disbursed);
    const financial = allottedAmount > 0 ? (disbursedAmount / allottedAmount) * 100 : 0;
    const physical = project.status === "completed" ? 100 : project.status === "planned" ? 0 : Math.min(95, Math.max(12, financial));

    return {
      name: project.project_title,
      code: project.project_code,
      sector: project.sector,
      budget: formatPHP(proposed),
      financial,
      physical,
    };
  });

  return {
    fiscalYear,
    fiscalYears: fiscalYears.map((year) => toNumber(year)).filter((year) => year > 0).sort((a, b) => b - a),
    startDate: `01/01/${fiscalYear}`,
    endDate: `12/31/${fiscalYear}`,
    kpis: {
      totalProjects,
      activeProjects,
      completed,
      appropriated,
      utilizedPercent,
    },
    statusDistribution,
    completionTrends,
    projectSummaries,
  };
}

export function formatPHP(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: amount >= 1_000_000 ? 1 : 2,
    minimumFractionDigits: amount >= 1_000_000 ? 1 : 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}