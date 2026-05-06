import { apiRequest } from "./api";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  return apiRequest<T>(path, init);
}

export interface SectorConfig {
  sector_id: string;
  sector_code: string;
  sector_name: string;
}

export interface PhaseConfig {
  phase_id: string;
  phase_name: string;
  weight_percent: number;
}

export interface PhaseWeightSummary {
  total_weight: number;
  is_balanced: boolean;
  active_phases: number;
}

export interface ProgramConfig {
  program_id: string;
  program_code: string;
  program_name: string;
  sector_id: string;
  is_active: boolean;
}

export interface OfficeConfig {
  office_id: string;
  office_code: string;
  office_name: string;
  office_type: number;
}

function normalizeSector(raw: any): SectorConfig {
  return {
    sector_id: String(raw?.sector_id ?? ""),
    sector_code: String(raw?.sector_code ?? ""),
    sector_name: String(raw?.sector_name ?? ""),
  };
}

function normalizePhase(raw: any): PhaseConfig {
  return {
    phase_id: String(raw?.phase_id ?? ""),
    phase_name: String(raw?.phase_name ?? ""),
    weight_percent: Number(raw?.weight_percent ?? 0),
  };
}

function normalizeProgram(raw: any): ProgramConfig {
  return {
    program_id: String(raw?.program_id ?? ""),
    program_code: String(raw?.program_code ?? ""),
    program_name: String(raw?.program_name ?? ""),
    sector_id: String(raw?.sector_id ?? ""),
    is_active: Boolean(raw?.is_active ?? true),
  };
}

function normalizeOffice(raw: any): OfficeConfig {
  return {
    office_id: String(raw?.office_id ?? ""),
    office_code: String(raw?.office_code ?? ""),
    office_name: String(raw?.office_name ?? ""),
    office_type: Number(raw?.office_type ?? 0),
  };
}

export async function listSectors(): Promise<SectorConfig[]> {
  const rows = await request<any[]>("/sectors/", { method: "GET" });
  return Array.isArray(rows) ? rows.map(normalizeSector) : [];
}

export async function createSector(payload: {
  sector_code: string;
  sector_name: string;
}): Promise<SectorConfig> {
  const row = await request<any>("/sectors/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return normalizeSector(row);
}

export async function updateSector(
  sectorId: string,
  payload: Partial<Pick<SectorConfig, "sector_code" | "sector_name">>,
): Promise<SectorConfig> {
  const row = await request<any>(`/sectors/${sectorId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return normalizeSector(row);
}

export async function deleteSector(sectorId: string): Promise<{ detail?: string; message?: string }> {
  return request(`/sectors/${sectorId}`, { method: "DELETE" });
}

export async function listPhases(): Promise<PhaseConfig[]> {
  const rows = await request<any[]>("/phase-configs/", { method: "GET" });
  return Array.isArray(rows) ? rows.map(normalizePhase) : [];
}

export async function listPrograms(): Promise<ProgramConfig[]> {
  const rows = await request<any[]>("/programs/", { method: "GET" });
  return Array.isArray(rows) ? rows.map(normalizeProgram) : [];
}

export async function listOffices(): Promise<OfficeConfig[]> {
  const rows = await request<any[]>("/offices/", { method: "GET" });
  return Array.isArray(rows) ? rows.map(normalizeOffice) : [];
}

export async function getPhaseWeightSummary(): Promise<PhaseWeightSummary> {
  const row = await request<any>("/phase-configs/weight-summary", { method: "GET" });

  return {
    total_weight: Number(row?.total_weight ?? 0),
    is_balanced: Boolean(row?.is_balanced),
    active_phases: Number(row?.active_phases ?? 0),
  };
}

export async function createPhase(payload: {
  phase_name: string;
  weight_percent: number;
}): Promise<PhaseConfig> {
  const row = await request<any>("/phase-configs/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return normalizePhase(row);
}

export async function updatePhase(
  phaseId: string,
  payload: Partial<Pick<PhaseConfig, "phase_name" | "weight_percent">>,
): Promise<PhaseConfig> {
  const row = await request<any>(`/phase-configs/${phaseId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return normalizePhase(row);
}

export async function deletePhase(phaseId: string): Promise<{ detail?: string; message?: string }> {
  return request(`/phase-configs/${phaseId}`, { method: "DELETE" });
}