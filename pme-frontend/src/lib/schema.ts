// lib/schema.ts

export interface DashboardPayload {
  kpis: {
    total_projects: number;
    ongoing: number;
    completed: number;
    delayed: number;
    utilization_percent: number;
    funds_utilized: number;
  };
  financial: {
    month: string;
    allocated: number;
    utilized: number;
  }[];
  sectors: {
    sector_id: number;
    sector_name: string;
    project_count: number;
    share: number;
  }[];
  activity: {
    id: number;
    project_title: string;
    detail: string;
    highlight?: string;
    highlight_tone?: string;
    occurred_at: string;
  }[];
  markers: {
    project_id: number;
    latitude: number;
    longitude: number;
    status: string;
  }[];
}

export type ProjectStatus =
  | "planned"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "delayed";

export interface ProgramCard {
  program_id: number;
  program_code: string;
  program_name: string;
  description: string;
  project_count: number;
}

export interface SectorCard {
  sector_id: number;
  sector_code: string;
  sector_name: string;
  program_count: number;
  project_count: number;
  programs: ProgramCard[];
}

export interface ProgramListPayload {
  total_programs: number;
  total_projects: number;
  sectors: SectorCard[];
}

export interface ProjectListItem {
  project_id: number;
  project_code: string;
  project_title: string;
  sector_name: string;
  barangay: string | null;
  status: ProjectStatus;
  total_budget: number;
  utilization_percent: number;
  created_at: string;
}

export interface ProjectSectorOption {
  sector_id: number;
  sector_name: string;
}

export interface ProjectListPayload {
  total: number;
  items: ProjectListItem[];
  sectors: ProjectSectorOption[];
}

export interface AipListItem {
  project_aip_id: number;
  aip_reference_code: string;
  proposed_budget_ps: number;
  proposed_budget_mooe: number;
  proposed_budget_fe: number;
  proposed_budget_co: number;
  project: {
    project_title: string;
    office: {
      office_name: string;
    };
  };
}
