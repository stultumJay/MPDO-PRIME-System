import type { DashboardPayload } from "@/lib/schema";

export async function getDashboardMetrics(
  year: number,
): Promise<DashboardPayload> {
  return {
    kpis: {
      total_projects: 124,
      ongoing: 48,
      completed: 42,
      delayed: 9,
      utilization_percent: 64.2,
      funds_utilized: 142_800_000,
    },
    financial: [
      { month: "Jul", allocated: 28_000_000, utilized: 14_000_000 },
      { month: "Aug", allocated: 31_000_000, utilized: 19_000_000 },
      { month: "Sep", allocated: 35_000_000, utilized: 27_000_000 },
      { month: "Oct", allocated: 38_000_000, utilized: 32_000_000 },
      { month: "Nov", allocated: 29_000_000, utilized: 22_000_000 },
      { month: "Dec", allocated: 34_000_000, utilized: 28_000_000 },
    ],
    sectors: [
      { sector_id: 1, sector_name: "Infrastructure", project_count: 42, share: 0.34 },
      { sector_id: 2, sector_name: "Social", project_count: 31, share: 0.25 },
      { sector_id: 3, sector_name: "Economic", project_count: 18, share: 0.15 },
      { sector_id: 4, sector_name: "Environment", project_count: 16, share: 0.13 },
      { sector_id: 5, sector_name: "Institutional", project_count: 10, share: 0.08 },
      { sector_id: 6, sector_name: "Others", project_count: 7, share: 0.05 },
    ],
    activity: [
      {
        id: 1,
        project_title: "Airport Access Road Widening",
        detail: `Phase update synced for ${year} field review.`,
        occurred_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
      {
        id: 2,
        project_title: "Rural Health Unit Expansion",
        detail: "Completion milestone was verified by MPDO staff.",
        occurred_at: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
      },
      {
        id: 3,
        project_title: "Market Livelihood Annex",
        detail: "Budget utilization variance was flagged for review.",
        occurred_at: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
      },
    ],
    markers: [
      { project_id: 1, latitude: 30, longitude: 48, status: "in_progress" },
      { project_id: 2, latitude: 44, longitude: 61, status: "completed" },
      { project_id: 3, latitude: 59, longitude: 39, status: "delayed" },
      { project_id: 4, latitude: 72, longitude: 68, status: "planned" },
    ],
  };
}
