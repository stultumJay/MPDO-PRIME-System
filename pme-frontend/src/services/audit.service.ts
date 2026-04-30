import { apiRequest, withQuery } from "./api";

function buildUrl(path: string, query?: Record<string, string | number | null | undefined>) {
  const endpoint = path.startsWith("/") ? path : `/${path}`;
  return withQuery(endpoint, query);
}

async function requestJson<T>(path: string, query?: Record<string, string | number | null | undefined>) {
  return apiRequest<T>(buildUrl(path, query));
}

export type AuditAction = "Approval" | "Update" | "Create" | "Delete" | "Access";

export interface AuditEntry {
  id: string;
  action: AuditAction;
  title: string;
  module: string;
  user: string;
  timestamp: string;
  detail: string;
}

type AuditResponse = {
  audit_id?: string;
  id?: string | number;
  action?: string;
  entity?: string;
  entity_id?: string | null;
  description?: string | null;
  created_at?: string;
}[];

function normalizeAction(value: unknown): AuditAction {
  const text = String(value ?? "").toLowerCase();
  if (text.includes("approve") || text.includes("auth")) return "Approval";
  if (text.includes("delete") || text.includes("remove")) return "Delete";
  if (text.includes("create") || text.includes("add")) return "Create";
  if (text.includes("access") || text.includes("login") || text.includes("permission")) return "Access";
  return "Update";
}

function formatLabel(value: unknown, fallback = "System Activity") {
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  return text.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatTimestamp(value: unknown) {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return "No timestamp";
  return date.toLocaleString("en-PH", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function getAuditEntries(): Promise<AuditEntry[]> {
  const rows = await requestJson<AuditResponse>("/audit/activities", { limit: 100 });

  return rows.map((row, index) => {
    const action = normalizeAction(row.action);
    const module = formatLabel(row.entity, "System");

    return {
      id: String(row.entity_id ?? row.audit_id ?? row.id ?? index + 1),
      action,
      title: `${formatLabel(row.action, action)} Recorded`,
      module,
      user: "System",
      timestamp: formatTimestamp(row.created_at),
      detail: row.description?.trim() || `${action} activity recorded for ${module}.`,
    };
  });
}