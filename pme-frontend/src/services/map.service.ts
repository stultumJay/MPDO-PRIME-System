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

export type MapSector =
  | "Infrastructure"
  | "Social"
  | "Economic"
  | "Environment"
  | "Institutional"
  | "Others";

export type MapStatus = "On Track" | "Delayed" | "Completed";

type MapLocationResponse = {
  project_id: string;
  project_code: string;
  title: string;
  barangay: string;
  sector: string;
  status: string;
  lat: number | string;
  lng: number | string;
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

type BudgetUtilizationResponse = {
  records: {
    project_code: string;
    appropriated: number | string;
  }[];
};

export interface MapProjectMarker {
  id: string;
  code: string;
  name: string;
  barangay: string;
  sector: MapSector;
  status: MapStatus;
  rawStatus: string;
  year: number;
  budget: number;
  lat: number;
  lng: number;
  icon: string;
}

export interface MapPayload {
  fiscalYear: number;
  years: number[];
  markers: MapProjectMarker[];
  barangays: string[];
}

function normalizeSector(sector: string): MapSector {
  const value = sector.toLowerCase();
  if (value.includes("infra")) return "Infrastructure";
  if (value.includes("social")) return "Social";
  if (value.includes("economic")) return "Economic";
  if (value.includes("environment")) return "Environment";
  if (value.includes("institution")) return "Institutional";
  return "Others";
}

function normalizeStatus(status: string): MapStatus {
  const value = status.toLowerCase();
  if (value.includes("complete")) return "Completed";
  if (value.includes("delay")) return "Delayed";
  return "On Track";
}

function iconForSector(sector: MapSector) {
  if (sector === "Infrastructure") return "construction";
  if (sector === "Social") return "groups";
  if (sector === "Economic") return "storefront";
  if (sector === "Environment") return "park";
  if (sector === "Institutional") return "account_balance";
  return "place";
}

export async function getMapData(fiscalYear?: number): Promise<MapPayload> {
  const fiscalYearsRaw = await requestJson<number[]>("/aip/fiscal-years");
  const years = fiscalYearsRaw.map((year) => toNumber(year)).filter((year) => year > 0).sort((a, b) => b - a);
  const currentYear = new Date().getFullYear();
  const selectedYear = fiscalYear ?? (years.includes(currentYear) ? currentYear : years[0]) ?? currentYear;

  const [locations, summaries, budgetReport] = await Promise.all([
    requestJson<MapLocationResponse>("/map/", { fiscal_year: selectedYear }),
    requestJson<ProjectSummaryResponse>("/reports/projects-summary", { fiscal_year: selectedYear }),
    requestJson<BudgetUtilizationResponse>("/reports/budget-utilization", { fiscal_year: selectedYear }).catch(() => ({
      records: [],
    })),
  ]);

  const summaryByCode = new Map(summaries.map((summary) => [summary.project_code, summary]));
  const appropriationByCode = new Map<string, number>();

  for (const record of budgetReport.records) {
    const key = String(record.project_code ?? "");
    appropriationByCode.set(key, (appropriationByCode.get(key) ?? 0) + toNumber(record.appropriated));
  }

  const markers = locations.map((location) => {
    const sector = normalizeSector(location.sector);
    const status = normalizeStatus(location.status);
    const lat = toNumber(location.lat);
    const lng = toNumber(location.lng);
    const summary = summaryByCode.get(location.project_code);
    const budget =
      appropriationByCode.get(location.project_code) ??
      toNumber(summary?.allotted, toNumber(summary?.proposed));

    return {
      id: location.project_id,
      code: location.project_code,
      name: location.title,
      barangay: location.barangay,
      sector,
      status,
      rawStatus: location.status,
      year: selectedYear,
      budget,
      lat,
      lng,
      icon: iconForSector(sector),
    };
  });

  return {
    fiscalYear: selectedYear,
    years,
    markers,
    barangays: Array.from(new Set(markers.map((marker) => marker.barangay))).sort(),
  };
}

export function formatCompactPHP(value: number) {
  if (value >= 1_000_000) return `PHP ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `PHP ${(value / 1_000).toFixed(1)}K`;
  return `PHP ${value.toFixed(2)}`;
}
