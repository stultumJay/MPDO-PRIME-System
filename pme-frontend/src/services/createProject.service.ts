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

function normalizeCode(raw: unknown): string {
  return asString(raw, "").trim();
}

function normalizeName(raw: unknown): string {
  return asString(raw, "").trim();
}

export interface CreateProjectSectorOption {
  id: string;
  code: string;
  name: string;
}

export interface CreateProjectOfficeOption {
  id: string;
  code: string;
  name: string;
}

export interface CreateProjectProgramOption {
  id: string;
  code: string;
  name: string;
  sector_id: string;
  office_id: string;
}

export interface CreateProjectOptions {
  sectors: CreateProjectSectorOption[];
  offices: CreateProjectOfficeOption[];
  programs: CreateProjectProgramOption[];
}

export interface CreateProjectPayload {
  project_title: string;
  project_description?: string;
  program_id: string;
  sector_id: string;
  office_id: string;
  barangay?: string;
  street?: string;
  location_lat?: number;
  location_lng?: number;
  expected_start_date?: string;
  expected_end_date?: string;
  locational_clearance_status?: boolean;
}

export interface CreateProjectResult {
  project_id: string;
  project_code?: string;
  project_title?: string;
  status?: string;
  is_integrated?: boolean;
  locational_clearance_status?: boolean;
}

function normalizeSector(raw: Record<string, unknown>): CreateProjectSectorOption {
  return {
    id: asString(raw.sector_id),
    code: normalizeCode(raw.sector_code),
    name: normalizeName(raw.sector_name),
  };
}

function normalizeOffice(raw: Record<string, unknown>): CreateProjectOfficeOption {
  return {
    id: asString(raw.office_id),
    code: normalizeCode(raw.office_code),
    name: normalizeName(raw.office_name),
  };
}

function normalizeProgram(raw: Record<string, unknown>): CreateProjectProgramOption {
  return {
    id: asString(raw.program_id),
    code: normalizeCode(raw.program_code),
    name: normalizeName(raw.program_name),
    sector_id: asString(raw.sector_id),
    office_id: "",
  };
}

export async function getCreateProjectOptions(): Promise<CreateProjectOptions> {
  const [sectorsRaw, officesRaw, programsRaw] = await Promise.all([
    requestJson<Record<string, unknown>[]>("/sectors"),
    requestJson<Record<string, unknown>[]>("/offices"),
    requestJson<Record<string, unknown>[]>("/programs"),
  ]);

  const sectors = Array.isArray(sectorsRaw) ? sectorsRaw.map(normalizeSector) : [];
  const offices = Array.isArray(officesRaw) ? officesRaw.map(normalizeOffice) : [];
  const programs = Array.isArray(programsRaw) ? programsRaw.map(normalizeProgram) : [];

  return {
    sectors,
    offices,
    programs,
  };
}

export async function createProject(payload: CreateProjectPayload) {
  return requestJsonBody<CreateProjectResult>("/projects/", "POST", {
    ...payload,
    locational_clearance_status: false,
  });
}
