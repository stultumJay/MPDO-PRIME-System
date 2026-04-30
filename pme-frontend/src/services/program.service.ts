import { apiRequest } from "./api";

export interface Program {
  program_id: string;
  program_code: string;
  program_name: string;
  description?: string;
  sector_id: string;
}

export interface Sector {
  sector_id: string;
  sector_code?: string;
  sector_name: string;
}

export interface SectorCard {
  sector_id: string;
  sector_code?: string;
  sector_name: string;
  program_count: number;
  project_count: number;
  programs: {
    program_id: string;
    program_code: string;
    program_name: string;
    description?: string;
    project_count: number;
  }[];
}

export interface ProgramListPayload {
  sectors: SectorCard[];
  total_programs: number;
  total_projects: number;
}

export interface CreateProgramPayload {
  program_name: string;
  sector_id: string;
  description?: string;
}

export interface UpdateProgramPayload {
  program_name?: string;
  sector_id?: string;
  description?: string;
}

async function fetchJSON<T>(url: string, options?: RequestInit) {
  return apiRequest<T>(url, options);
}

/**
 * Backend does NOT return grouped sectors,
 * so we group programs by sector client-side.
 */
export async function getProgramsGrouped(): Promise<ProgramListPayload> {
  const [programs, sectors] = await Promise.all([
    fetchJSON<Program[]>("/programs"),
    fetchJSON<Sector[]>("/sectors"),
  ]);

  const sectorCards: SectorCard[] = sectors.map((s: Sector) => {
    const sectorPrograms = programs.filter(
      (p: Program) => p.sector_id === s.sector_id
    );

    const programItems = sectorPrograms.map((p: Program) => ({
      program_id: p.program_id,
      program_code: p.program_code,
      program_name: p.program_name,
      description: p.description ?? "—",
      project_count: 0,
    }));

    return {
      sector_id: s.sector_id,
      sector_code: s.sector_code,
      sector_name: s.sector_name,
      program_count: programItems.length,
      project_count: 0,
      programs: programItems,
    };
  });

  return {
    sectors: sectorCards,
    total_programs: sectorCards.reduce((a, b) => a + b.program_count, 0),
    total_projects: 0,
  };
}

export async function createProgram(payload: CreateProgramPayload) {
  return fetchJSON("/programs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProgram(id: string, payload: UpdateProgramPayload) {
  return fetchJSON(`/programs/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteProgram(id: string) {
  return fetchJSON(`/programs/${id}`, {
    method: "DELETE",
  });
}
