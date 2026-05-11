import { apiRequest, withQuery, type ApiQuery } from "./api";

function buildUrl(path: string, query?: ApiQuery) {
  const endpoint = path.startsWith("/") ? path : `/${path}`;
  return withQuery(endpoint, query);
}

async function requestJson<T>(path: string, query?: ApiQuery): Promise<T> {
  return apiRequest<T>(buildUrl(path, query));
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
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

const FUND_SOURCE_CATEGORIES = [
  "National Government Fund",
  "Donor Fund",
  "Public-Private Partnership Fund",
  "Regional Fund",
  "20% General Fund (LGU)",
  "External Source (LGU)",
  "5% LDRRMF (LGU)",
  "Excise Tax (LGU)",
  "LEE Fund (LGU)",
  "Municipal Development Fund (MDF)",
] as const;

function canonicalFundSource(value: unknown) {
  const label = toLabel(value, "Unassigned");
  const key = normalizeOption(label).replace(/[^a-z0-9]/g, "");

  if (key.includes("national")) return "National Government Fund";
  if (key.includes("donor")) return "Donor Fund";
  if (key.includes("publicprivate") || key.includes("ppp"))
    return "Public-Private Partnership Fund";
  if (key.includes("regional")) return "Regional Fund";
  if (key.includes("20") || key.includes("generalfund"))
    return "20% General Fund (LGU)";
  if (key.includes("external")) return "External Source (LGU)";
  if (key.includes("ldrrmf") || key.includes("5")) return "5% LDRRMF (LGU)";
  if (key.includes("excise")) return "Excise Tax (LGU)";
  if (key.includes("lee")) return "LEE Fund (LGU)";
  if (key.includes("mdf") || key.includes("municipaldevelopment"))
    return "Municipal Development Fund (MDF)";

  return (
    FUND_SOURCE_CATEGORIES.find(
      (category) => normalizeOption(category) === normalizeOption(label),
    ) ?? label
  );
}

// ─────────────────────────────────────────────
// BACKEND RESPONSE TYPES
// ─────────────────────────────────────────────

/**
 * Primary data source: /reports/budget-utilization
 * The backend walks Appropriation → AppropriationFundSource → Allotment → Disbursement.
 *
 *  - `appropriated`: AppropriationFundSource.appropriated_amount  (approved appropriation)
 *  - `allotted`:     sum of Allotment.amount_released
 *  - `disbursed`:    sum of Disbursement.disbursement_amount
 *
 * AIP proposed_budget_* values do NOT appear in this response and must NOT
 * be mixed in anywhere on this page.
 */
type BudgetUtilizationResponse = {
  fiscal_year: number;
  records: {
    project_code: string;
    project_title: string;
    sector: string;
    fund_source: string;
    /** approved_appropriation (AppropriationFundSource.appropriated_amount) */
    appropriated: number | string;
    allotted: number | string;
    disbursed: number | string;
  }[];
  /**
   * Allocation by sector — grouped on the backend from actual allotted amounts.
   * A sector is only included when its allotted total is > 0.
   */
  allocation: {
    sector: string;
    /** Sum of Allotment.amount_released for the sector */
    allotted: number | string;
  }[];
};

/**
 * Fallback data source: /reports/projects-summary
 * Used when budget-utilization endpoint is unavailable.
 * The `approved_appropriation` field is the sum of AppropriationFundSource rows
 * for that project — it is the correct budget ceiling to display.
 * The `proposed` field (AIP) must NOT be used for any calculation.
 */
type ProjectSummaryResponse = {
  project_code: string;
  project_title: string;
  sector: string;
  fund_source?: string;
  /** AIP proposed budget — informational only, never used for calculations */
  proposed: number | string;
  /** approved_appropriation — the financial source of truth for this page */
  approved_appropriation?: number | string;
  allotted: number | string;
  obligated: number | string;
  disbursed: number | string;
}[];

// ─────────────────────────────────────────────
// EXPORTED TYPES
// ─────────────────────────────────────────────

export interface BudgetRecord {
  id: string;
  title: string;
  /** approved_appropriation — the authorised ceiling, not the AIP proposed amount */
  approved: number;
  /** sum of allotted amounts released */
  released: number;
  /** sum of disbursements */
  utilized: number;
  sector: string;
  source: string;
}

export interface BudgetAllocationSlice {
  label: string;
  /** Formatted allotted amount (currency string) */
  value: string;
  /** Share of total allotted (0–100) */
  percent: number;
  /** Tailwind bg class for the legend dot */
  color: string;
  /** Hex colour for the conic-gradient donut chart */
  hex: string;
}

export interface BudgetPayload {
  fiscalYear: number;
  fiscalYears: string[];
  sectors: string[];
  fundSources: string[];
  records: BudgetRecord[];
  /** Only sectors with allotted > 0 (pre-filtered by backend and service) */
  allocation: BudgetAllocationSlice[];
  stats: {
    /** Sum of approved_appropriation across all filtered records */
    totalBudget: number;
    /** Sum of disbursed amounts */
    totalSpent: number;
    remainingBalance: number;
    utilizationPercent: number;
    alignmentPercent: number;
  };
}

// ─────────────────────────────────────────────
// PALETTE
// ─────────────────────────────────────────────

/**
 * Each entry pairs a Tailwind bg class (for legend dots) with the hex value
 * that will be used in the conic-gradient donut chart.
 * Having both representations avoids any runtime class-to-hex mapping.
 */
const SECTOR_PALETTE: { color: string; hex: string }[] = [
  { color: "bg-primary",     hex: "#14b8a6" },
  { color: "bg-slate-900",   hex: "#0f172a" },
  { color: "bg-blue-500",    hex: "#3b82f6" },
  { color: "bg-orange-500",  hex: "#f97316" },
  { color: "bg-emerald-500", hex: "#10b981" },
  { color: "bg-rose-500",    hex: "#f43f5e" },
  { color: "bg-violet-500",  hex: "#8b5cf6" },
  { color: "bg-amber-500",   hex: "#f59e0b" },
  { color: "bg-slate-400",   hex: "#94a3b8" },
];

// ─────────────────────────────────────────────
// MAIN SERVICE FUNCTION
// ─────────────────────────────────────────────

export async function getBudgetData(
  fiscalYearOverride?: number,
): Promise<BudgetPayload> {
  const fiscalYearsRaw = await requestJson<number[]>("/aip/fiscal-years");
  const years = fiscalYearsRaw.map((y) => toNumber(y)).filter((y) => y > 0);
  const fiscalYear =
    fiscalYearOverride ??
    (years.length > 0 ? Math.max(...years) : new Date().getFullYear());

  let records: BudgetRecord[] = [];
  let allocationRows: BudgetUtilizationResponse["allocation"] = [];

  try {
    // Primary path: budget-utilization report (approved_appropriation chain)
    const budget = await requestJson<BudgetUtilizationResponse>(
      "/reports/budget-utilization",
      { fiscal_year: fiscalYear },
    );

    records = budget.records.map((record) => ({
      id: record.project_code,
      title: record.project_title,
      // `appropriated` here is AppropriationFundSource.appropriated_amount
      // — the legally approved ceiling, not the AIP proposed budget.
      approved: toNumber(record.appropriated),
      released: toNumber(record.allotted),
      utilized: toNumber(record.disbursed),
      sector: toLabel(record.sector, "Unassigned"),
      source: canonicalFundSource(record.fund_source),
    }));

    // The backend already groups allocation by actual allotted amounts.
    // Zero-value sectors are excluded server-side; the frontend filter below
    // is a defensive guard only.
    allocationRows = budget.allocation;
  } catch {
    // Fallback: projects-summary report
    const projects = await requestJson<ProjectSummaryResponse>(
      "/reports/projects-summary",
      { fiscal_year: fiscalYear },
    );

    records = projects.map((project) => ({
      id: project.project_code,
      title: project.project_title,
      // Use approved_appropriation as the budget ceiling.
      // The `proposed` (AIP) field is intentionally excluded from all calculations.
      approved: toNumber(project.approved_appropriation),
      released: toNumber(project.allotted),
      utilized: toNumber(project.disbursed),
      sector: toLabel(project.sector, "Unassigned"),
      source: canonicalFundSource(project.fund_source),
    }));

    // Build sector allocation from released amounts in the fallback data.
    const sectorMap = new Map<string, number>();
    for (const record of records) {
      sectorMap.set(
        record.sector,
        (sectorMap.get(record.sector) ?? 0) + record.released,
      );
    }
    allocationRows = [...sectorMap.entries()].map(([sector, allotted]) => ({
      sector,
      allotted,
    }));
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  // totalBudget = sum of approved_appropriation (record.approved)
  // totalSpent  = sum of disbursed (record.utilized)
  // Neither value is derived from AIP proposed budgets.
  const totalBudget = records.reduce((sum, r) => sum + r.approved, 0);
  const totalReleased = records.reduce((sum, r) => sum + r.released, 0);
  const totalSpent = records.reduce((sum, r) => sum + r.utilized, 0);
  const utilizationPercent =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const alignmentPercent =
    totalBudget > 0 ? (totalReleased / totalBudget) * 100 : 0;

  // ── Allocation by sector ──────────────────────────────────────────────────
  // FIX: Filter out zero-value sectors BEFORE building the slice array so the
  // donut chart never renders phantom segments for sectors with no actual money.
  const allocation: BudgetAllocationSlice[] = allocationRows
    .filter((row) => toNumber(row.allotted) > 0)
    .map((row, index) => {
      const allotted = toNumber(row.allotted);
      const palette = SECTOR_PALETTE[index % SECTOR_PALETTE.length];
      return {
        label: toLabel(row.sector, "Unassigned"),
        value: formatCompactPHP(allotted),
        percent: totalReleased > 0 ? (allotted / totalReleased) * 100 : 0,
        color: palette.color,
        hex: palette.hex,
      };
    });

  return {
    fiscalYear,
    fiscalYears: years.sort((a, b) => b - a).map((y) => `FY ${y}`),
    sectors: ["All Sectors", ...uniqueSortedLabels(records.map((r) => r.sector))],
    fundSources: [
      "All Sources",
      ...uniqueSortedLabels(records.map((r) => r.source)),
    ],
    records,
    allocation,
    stats: {
      totalBudget,
      totalSpent,
      remainingBalance: Math.max(totalBudget - totalSpent, 0),
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