import { apiRequest, withQuery, type ApiQuery } from "./api";

function buildUrl(path: string, query?: ApiQuery) {
  const endpoint = path.startsWith("/") ? path : `/${path}`;
  return withQuery(endpoint, query);
}

async function requestJson<T>(path: string, query?: ApiQuery): Promise<T> {
  return apiRequest<T>(buildUrl(path, query));
}

function toNumber(value: unknown, fallback = 0) {
  const n = typeof value === "string" ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toLabel(value: unknown, fallback: string) {
  const label = String(value ?? "").trim();
  return label || fallback;
}

function normalizeOption(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function uniqueSortedLabels(values: string[]) {
  const byKey = new Map<string, string>();

  for (const value of values) {
    const label = toLabel(value, "Unassigned");
    const key = normalizeOption(label);
    if (!byKey.has(key)) byKey.set(key, label);
  }

  return [...byKey.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

type BudgetUtilizationResponse = {
  fiscal_year: number;
  records: {
    project_code: string;
    project_title: string;
    sector: string;
    fund_source: string;
    appropriated: number | string;
    allotted: number | string;
    disbursed: number | string;
  }[];
  allocation: {
    sector: string;
    allotted: number | string;
  }[];
};

type ProjectSummaryResponse = {
  project_code: string;
  project_title: string;
  sector: string;
  proposed: number | string;
  allotted: number | string;
  obligated: number | string;
  disbursed: number | string;
}[];

export interface BudgetRecord {
  id: string;
  title: string;
  approved: number;
  released: number;
  utilized: number;
  sector: string;
  source: string;
}

export interface BudgetAllocationSlice {
  label: string;
  value: string;
  percent: number;
  color: string;
}

export interface BudgetPayload {
  fiscalYear: number;
  fiscalYears: string[];
  sectors: string[];
  fundSources: string[];
  records: BudgetRecord[];
  allocation: BudgetAllocationSlice[];
  stats: {
    totalBudget: number;
    totalSpent: number;
    remainingBalance: number;
    utilizationPercent: number;
    alignmentPercent: number;
  };
}

export async function getBudgetData(fiscalYearOverride?: number): Promise<BudgetPayload> {
  const fiscalYearsRaw = await requestJson<number[]>("/aip/fiscal-years");
  const years = fiscalYearsRaw.map((year) => toNumber(year)).filter((year) => year > 0);
  const fiscalYear = fiscalYearOverride ?? (years.length > 0 ? Math.max(...years) : new Date().getFullYear());

  let projects: ProjectSummaryResponse = [];
  let allocationRows: BudgetUtilizationResponse["allocation"] = [];
  let records: BudgetRecord[] = [];

  try {
    const budget = await requestJson<BudgetUtilizationResponse>("/reports/budget-utilization", {
      fiscal_year: fiscalYear,
    });
    records = budget.records.map((record) => ({
      id: record.project_code,
      title: record.project_title,
      approved: toNumber(record.appropriated),
      released: toNumber(record.allotted),
      utilized: toNumber(record.disbursed),
      sector: toLabel(record.sector, "Unassigned"),
      source: toLabel(record.fund_source, "Unassigned"),
    }));
    allocationRows = budget.allocation;
  } catch {
    projects = await requestJson<ProjectSummaryResponse>("/reports/projects-summary", {
      fiscal_year: fiscalYear,
    });
    records = projects.map((project) => ({
      id: project.project_code,
      title: project.project_title,
      approved: toNumber(project.proposed),
      released: toNumber(project.allotted),
      utilized: toNumber(project.disbursed),
      sector: toLabel(project.sector, "Unassigned"),
      source: "Project AIP",
    }));
  }

  const totalBudget = records.reduce((sum, record) => sum + record.approved, 0);
  const totalReleased = records.reduce((sum, record) => sum + record.released, 0);
  const totalSpent = records.reduce((sum, record) => sum + record.utilized, 0);
  const utilizationPercent = totalReleased > 0 ? (totalSpent / totalReleased) * 100 : 0;
  const alignmentPercent = totalBudget > 0 ? (totalReleased / totalBudget) * 100 : 0;

  const palette = ["bg-primary", "bg-slate-900", "bg-blue-500", "bg-orange-500", "bg-emerald-500", "bg-slate-400"];
  const allocation = allocationRows
    .filter((row) => toNumber(row.allotted) > 0)
    .map((row, index) => {
      const allotted = toNumber(row.allotted);
      return {
        label: toLabel(row.sector, "Unassigned"),
        value: formatCompactPHP(allotted),
        percent: totalReleased > 0 ? (allotted / totalReleased) * 100 : 0,
        color: palette[index % palette.length],
      };
    });

  return {
    fiscalYear,
    fiscalYears: years.sort((a, b) => b - a).map((year) => `FY ${year}`),
    sectors: ["All Sectors", ...uniqueSortedLabels(records.map((record) => record.sector))],
    fundSources: ["All Sources", ...uniqueSortedLabels(records.map((record) => record.source))],
    records,
    allocation,
    stats: {
      totalBudget,
      totalSpent,
      remainingBalance: Math.max(totalReleased - totalSpent, 0),
      utilizationPercent,
      alignmentPercent,
    },
  };
}

export function formatCompactPHP(amount: number) {
  if (amount >= 1_000_000) return `PHP ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `PHP ${(amount / 1_000).toFixed(1)}K`;
  return `PHP ${amount.toFixed(2)}`;
}