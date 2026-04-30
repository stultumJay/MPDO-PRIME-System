import { apiRequest, withQuery, type ApiQuery } from "./api";

function buildUrl(
  path: string,
  query?: ApiQuery,
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

async function requestJsonBody<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  return apiRequest<T>(buildUrl(path), {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "string" ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function uniqueNumbers(values: unknown[]): number[] {
  return [...new Set(values.map((v) => toNumber(v)).filter((v) => Number.isFinite(v)))].sort(
    (a, b) => a - b,
  );
}

export interface AipSectorOption {
  sector_id: string;
  sector_code: string;
  sector_name: string;
}

export interface AipOfficeOption {
  office_id: string;
  office_name: string;
}

export interface AipListItem {
  project_aip_id: string;
  project_id: string;
  aip_reference_code: string;
  project_title: string;
  project_code: string;
  implementing_office: string;
  sector_id?: string;
  sector_name: string;
  aip_year: number;
  propose_budget_ps: number;
  propose_budget_mooe: number;
  propose_budget_fe: number;
  propose_budget_co: number;
  total_proposed: number;
  appropriated: number;
  allotted: number;
  utilized: number;
  utilization_percent: number;
}

export interface AipListPayload {
  items: AipListItem[];
  totals: {
    proposed: number;
    appropriated: number;
    allotted: number;
    utilized: number;
  };
  year: number;
  count: number;
}

export interface AipFilterOptions {
  fiscalYears: number[];
  sectors: AipSectorOption[];
  offices: AipOfficeOption[];
}

export interface AipListQuery {
  fiscalYear?: number;
  sectorId?: string;
  officeId?: string;
  q?: string;
  activeOnly?: boolean;
  page?: number;
  size?: number;
}

export interface AipProjectMatch {
  project_aip_id: string;
  project_id: string;
  fiscal_year: number;
  aip_reference_code: string;
}

type BackendRecord = Record<string, any>;

function normalizeAipItem(raw: BackendRecord): AipListItem {
  const project = raw.project ?? raw.project_obj ?? raw.project_data ?? {};
  const sector = raw.sector ?? project.sector ?? {};
  const office = raw.office ?? project.office ?? {};

  const proposeBudgetPs = toNumber(
    raw.proposed_budget_ps ?? raw.propose_budget_ps ?? raw.ps ?? raw.ps_amount,
  );
  const proposeBudgetMooe = toNumber(
    raw.proposed_budget_mooe ?? raw.propose_budget_mooe ?? raw.mooe ?? raw.mooe_amount,
  );
  const proposeBudgetFe = toNumber(
    raw.proposed_budget_fe ?? raw.propose_budget_fe ?? raw.fe ?? raw.fe_amount,
  );
  const proposeBudgetCo = toNumber(
    raw.proposed_budget_co ?? raw.propose_budget_co ?? raw.co ?? raw.co_amount,
  );

  const totalProposed =
    toNumber(raw.total_proposed) ||
    proposeBudgetPs + proposeBudgetMooe + proposeBudgetFe + proposeBudgetCo;

  return {
    project_aip_id: asString(raw.project_aip_id ?? raw.aip_id ?? raw.id),
    project_id: asString(raw.project_id ?? project.project_id),
    aip_reference_code: asString(raw.aip_reference_code ?? raw.aip_code ?? raw.code),
    project_title: asString(raw.project_title ?? project.project_title),
    project_code: asString(raw.project_code ?? project.project_code),
    implementing_office: asString(
      raw.office_name ??
        raw.implementing_office ??
        raw.implementing_office_name ??
        office.office_name ??
        office.name,
      "—",
    ),
    sector_id: asString(raw.sector_id ?? sector.sector_id, ""),
    sector_name: asString(raw.sector_name ?? sector.sector_name, "—"),
    aip_year: toNumber(raw.aip_year ?? raw.fiscal_year),
    propose_budget_ps: proposeBudgetPs,
    propose_budget_mooe: proposeBudgetMooe,
    propose_budget_fe: proposeBudgetFe,
    propose_budget_co: proposeBudgetCo,
    total_proposed: totalProposed,
    appropriated: toNumber(raw.appropriated),
    allotted: toNumber(raw.allotted),
    utilized: toNumber(raw.utilized),
    utilization_percent: toNumber(raw.utilization_percent),
  };
}

export async function getAipFilterOptions(): Promise<AipFilterOptions> {
  const [yearsRaw, sectorsRaw, officesRaw] = await Promise.all([
    requestJson<unknown[]>("/aip/fiscal-years"),
    requestJson<BackendRecord[]>("/sectors"),
    requestJson<BackendRecord[]>("/offices"),
  ]);

  const fiscalYears = uniqueNumbers(yearsRaw);

  const sectors: AipSectorOption[] = (sectorsRaw ?? [])
    .map((s) => ({
      sector_id: asString(s.sector_id),
      sector_code: asString(s.sector_code),
      sector_name: asString(s.sector_name),
    }))
    .sort((a, b) => a.sector_name.localeCompare(b.sector_name));

  const offices: AipOfficeOption[] = (officesRaw ?? [])
    .map((o) => ({
      office_id: asString(o.office_id),
      office_name: asString(o.office_name),
    }))
    .sort((a, b) => a.office_name.localeCompare(b.office_name));

  return { fiscalYears, sectors, offices };
}

export async function getAipList(query: AipListQuery = {}): Promise<AipListPayload> {
  const raw = await requestJson<BackendRecord[]>("/aip", {
    fiscal_year: query.fiscalYear,
    sector_id: query.sectorId,
    office_id: query.officeId,
    q: query.q,
    active_only: query.activeOnly ?? true,
    page: query.page ?? 1,
    size: query.size ?? 10,
  });

  const items = Array.isArray(raw)
    ? raw.map(normalizeAipItem).sort((a, b) =>
        a.aip_reference_code.localeCompare(b.aip_reference_code),
      )
    : [];

  const totals = items.reduce(
    (acc, it) => ({
      proposed: acc.proposed + it.total_proposed,
      appropriated: acc.appropriated + it.appropriated,
      allotted: acc.allotted + it.allotted,
      utilized: acc.utilized + it.utilized,
    }),
    { proposed: 0, appropriated: 0, allotted: 0, utilized: 0 },
  );

  return {
    items,
    totals,
    year: query.fiscalYear ?? items[0]?.aip_year ?? new Date().getFullYear(),
    count: items.length,
  };
}

export async function getAipByProject(projectId: string, year: number): Promise<AipProjectMatch | null> {
  const rows = await requestJson<BackendRecord[]>("/aip", {
    fiscal_year: year,
    q: projectId,
    active_only: true,
    page: 1,
    size: 100,
  });

  const match = rows.find((row) => {
    const project = row.project ?? {};
    return asString(row.project_id ?? project.project_id) === projectId;
  });

  if (!match) return null;

  return {
    project_aip_id: asString(match.project_aip_id),
    project_id: projectId,
    fiscal_year: toNumber(match.fiscal_year),
    aip_reference_code: asString(match.aip_reference_code),
  };
}

export async function createAipEntry(payload: {
  project_id: string;
  fiscal_year: number;
  propose_budget_ps?: number;
  propose_budget_mooe?: number;
  propose_budget_fe?: number;
  propose_budget_co?: number;
}) {
  return requestJsonBody("/aip", "POST", payload);
}