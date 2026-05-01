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

function formatLabel(text: string | undefined | null): string {
  if (!text) return "Activity";
  return text
    .replaceAll("_", " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function toneFromAction(action?: string): "primary" | "info" | "danger" {
  const value = (action ?? "").toLowerCase();

  if (value.includes("delete") || value.includes("remove") || value.includes("reject")) {
    return "danger";
  }

  if (value.includes("create") || value.includes("approve") || value.includes("resolve")) {
    return "info";
  }

  return "primary";
}

export interface OverviewKpis {
  total_projects: number;
  ongoing: number;
  completed: number;
  delayed: number;
  utilization_percent: number;
  funds_utilized: number;
}

export interface OverviewFinancialPoint {
  month: string;
  year?: number;
  allocated: number;
  utilized: number;
}

export interface OverviewSectorPoint {
  sector_id: string;
  sector_name: string;
  project_count: number;
  share: number;
}

export interface OverviewActivityPoint {
  id: string;
  project_title: string;
  detail: string;
  highlight?: string;
  highlight_tone?: "primary" | "info" | "danger";
  occurred_at: string;
}

export interface OverviewMarkerPoint {
  project_id: string;
  project_code?: string;
  title: string;
  barangay?: string | null;
  sector?: string | null;
  status: string;
  latitude: number;
  longitude: number;
}

export interface OverviewPayload {
  kpis: OverviewKpis;
  financial: OverviewFinancialPoint[];
  sectors: OverviewSectorPoint[];
  activity: OverviewActivityPoint[];
  markers: OverviewMarkerPoint[];
}

type SummaryResponse = {
  fiscal_year?: number | null;
  total_projects: number;
  ongoing: number;
  completed: number;
  delayed: number;
  utilization_percent: number;
  funds_utilized_amount: number;
};

type FinancialResponse = {
  month: string;
  year?: number;
  allocated: number | string;
  utilized: number | string;
};

type SectorImpactResponse = {
  sector: string;
  count: number;
}[];

type AuditResponse = {
  audit_id?: string;
  id?: string | number;
  action?: string;
  entity?: string;
  entity_id?: string | null;
  description?: string | null;
  performed_by_name?: string | null;
  created_at?: string;
}[];

type MapResponse = {
  project_id: string;
  project_code?: string;
  title: string;
  barangay?: string | null;
  sector?: string | null;
  status: string;
  lat: number | string;
  lng: number | string;
}[];

export interface OverviewQuery {
  fiscalYear?: number;
  months?: number;
  pulseLimit?: number;
}

async function getSummary(fiscalYear?: number): Promise<SummaryResponse> {
  return requestJson<SummaryResponse>("/dashboard/summary", {
    fiscal_year: fiscalYear,
  });
}

async function getFinancialTrend(
  months = 6,
  fiscalYear?: number,
): Promise<FinancialResponse[]> {
  return requestJson<FinancialResponse[]>("/dashboard/allocation-vs-disbursement", {
    months,
    fiscal_year: fiscalYear,
  });
}

async function getSectorImpact(
  fiscalYear?: number,
): Promise<SectorImpactResponse> {
  return requestJson<SectorImpactResponse>("/dashboard/sector-impact", {
    fiscal_year: fiscalYear,
  });
}

async function getInstitutionalPulse(limit = 8): Promise<AuditResponse> {
  return requestJson<AuditResponse>("/dashboard/institutional-pulse", {
    limit,
  });
}

async function getMapMarkers(fiscalYear?: number): Promise<MapResponse> {
  return requestJson<MapResponse>("/map", {
    fiscal_year: fiscalYear,
  });
}

export async function getOverviewData(
  options: OverviewQuery = {},
): Promise<OverviewPayload> {
  const months = options.months ?? 6;
  const pulseLimit = options.pulseLimit ?? 5;

  const [summary, financial, sectors, activity, markers] = await Promise.all([
    getSummary(options.fiscalYear),
    getFinancialTrend(months, options.fiscalYear),
    getSectorImpact(options.fiscalYear),
    getInstitutionalPulse(pulseLimit),
    getMapMarkers(options.fiscalYear).catch(() => [] as MapResponse),
  ]);

  const kpis: OverviewKpis = {
    total_projects: toNumber(summary.total_projects),
    ongoing: toNumber(summary.ongoing),
    completed: toNumber(summary.completed),
    delayed: toNumber(summary.delayed),
    utilization_percent: toNumber(summary.utilization_percent),
    funds_utilized: toNumber(summary.funds_utilized_amount),
  };

  const financialSeries: OverviewFinancialPoint[] = financial.map((row) => ({
    month: row.month,
    year: row.year,
    allocated: toNumber(row.allocated),
    utilized: toNumber(row.utilized),
  }));

  const sectorCounts = sectors.map((row, index) => ({
    sector_id: String(index + 1),
    sector_name: row.sector,
    project_count: toNumber(row.count),
    share: 0,
  }));

  const maxSectorCount = Math.max(
    ...sectorCounts.map((s) => s.project_count),
    1,
  );

  const sectorImpact: OverviewSectorPoint[] = sectorCounts.map((s) => ({
    ...s,
    share: s.project_count / maxSectorCount,
  }));

  const recentActivity: OverviewActivityPoint[] = activity
    .map((item, index) => {
      const action = item.action ?? "activity";
      const entityLabel = formatLabel(item.entity);
      const detail = item.description?.trim() || `${formatLabel(action)} recorded`;
      const actor = item.performed_by_name?.trim();

      return {
        id: item.audit_id ?? String(item.id ?? index),
        project_title: entityLabel,
        // Keeping the actor in the pulse detail makes recent activity accountable on the dashboard too.
        detail: actor && actor !== "System" ? `${actor}: ${detail}` : detail,
        highlight: formatLabel(action),
        highlight_tone: toneFromAction(action),
        occurred_at: item.created_at ?? new Date().toISOString(),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
    );

  const mapPoints: OverviewMarkerPoint[] = markers.map((row) => ({
    project_id: row.project_id,
    project_code: row.project_code,
    title: row.title,
    barangay: row.barangay ?? null,
    sector: row.sector ?? null,
    status: row.status,
    latitude: toNumber(row.lat),
    longitude: toNumber(row.lng),
  }));

  return {
    kpis,
    financial: financialSeries,
    sectors: sectorImpact,
    activity: recentActivity,
    markers: mapPoints,
  };
}
