import { apiRequest } from "./api";

export type TimelineStatus = "On Schedule" | "Slight Delay" | "Major Delay";

export interface TimelineProject {
  name: string;
  sector: string;
  status: TimelineStatus;
  startMonth: number;
  duration: number;
  progress: number;
  plannedProgress: number;
  performanceGap: number;
}

export interface GanttPayload {
  fiscalYear: number;
  years: string[];
  sectors: string[];
  projects: TimelineProject[];
}

export async function getGanttData(fiscalYear?: number): Promise<GanttPayload> {
  const url = fiscalYear 
    ? `/gantt/?year=${fiscalYear}` 
    : `/gantt`;
  
  return await apiRequest<GanttPayload>(url);
}
