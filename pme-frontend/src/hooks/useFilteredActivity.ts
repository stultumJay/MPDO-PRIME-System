import { useMemo } from "react";
import type { ProjectDetailPayload } from "@/services/project.service";

export type ActivityFilter = "all" | ProjectDetailPayload["activity"][number]["kind"];

export function useFilteredActivity(
  activity: ProjectDetailPayload["activity"] | undefined | null,
  search: string,
  filter: ActivityFilter,
) {
  return useMemo(() => {
    if (!activity) return [];

    const q = search.trim().toLowerCase();
    const items = filter === "all" ? activity : activity.filter((a) => a.kind === filter);

    return items.filter((item) => {
      if (!q) return true;

      return (
        item.title.toLowerCase().includes(q) ||
        item.detail.toLowerCase().includes(q) ||
        item.actor.toLowerCase().includes(q)
      );
    });
  }, [activity, search, filter]);
}