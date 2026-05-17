import { apiRequest, withQuery, type ApiQuery } from "./api";

// ─────────────────────────────────────────────
// URL BUILDER
// ─────────────────────────────────────────────
function buildUrl(
  path: string,
  query?: ApiQuery,
) {
  const endpoint = path.startsWith("/") ? path : `/${path}`;
  return withQuery(endpoint, query);
}

// ─────────────────────────────────────────────
// REQUEST WRAPPER
// ─────────────────────────────────────────────
async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  query?: Record<string, string | number | null | undefined>,
): Promise<T> {
  return apiRequest<T>(buildUrl(path, query), {
    ...init,
    body: init.body,
  });
}

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export type IssueStatus = "Open" | "Resolved";

export interface IssueProjectOption {
  project_id: string;
  project_code: string;
  project_title: string;
  sector_name?: string;
}

export interface IssueItem {
  issue_id: string;
  project_id: string;
  sector_name?: string | null;

  issue_name: string;
  issue_category: string;
  issue_description: string;

  status: IssueStatus;
  date_reported?: string | null;

  corrective_action?: string | null;
  resolved_date?: string | null;
  resolved_by?: string | null;
}

export interface CreateIssuePayload {
  project_id: string;
  issue_name: string;
  issue_category: string;
  issue_description: string;
  date_reported?: string;
}

export interface ResolveIssuePayload {
  corrective_action: string;
  resolved_date: string;
  resolved_by: string;
}

// ─────────────────────────────────────────────
// INTERNAL TYPES
// ─────────────────────────────────────────────
type IssueApiResponse = Record<string, any>;

type ProjectResponse = {
  project_id: string;
  project_code?: string | null;
  project_title?: string | null;
  sector_name?: string | null;
  sector?:
    | {
        sector_name?: string | null;
      }
    | null;
};

type ListResponse<T> =
  | T[]
  | {
      items?: T[];
      data?: T[];
      results?: T[];
      rows?: T[];
    };

// ─────────────────────────────────────────────
// NORMALIZERS
// ─────────────────────────────────────────────
function normalizeStatus(value: unknown): IssueStatus {
  return String(value ?? "").toLowerCase() === "resolved" ? "Resolved" : "Open";
}

function unwrapList<T>(payload: ListResponse<T>): T[] {
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.data ?? payload.results ?? payload.rows ?? [];
}

function normalizeIssue(row: IssueApiResponse): IssueItem {
  return {
    issue_id: String(row.issue_id ?? ""),
    project_id: String(row.project_id ?? ""),
    sector_name: row.sector_name ?? row.sector?.sector_name ?? null,

    issue_name: String(row.issue_name ?? row.issue_title ?? ""),
    issue_category: String(row.issue_category ?? row.severity ?? ""),
    issue_description: String(row.issue_description ?? ""),

    status: normalizeStatus(row.status),
    date_reported: row.date_reported ?? null,

    corrective_action: row.corrective_action ?? null,
    resolved_date: row.resolved_date ?? null,
    resolved_by: row.resolved_by ?? null,
  };
}

// ─────────────────────────────────────────────
// API FUNCTIONS
// ─────────────────────────────────────────────
export async function getIssueProjectOptions(): Promise<IssueProjectOption[]> {
  const payload = await requestJson<ListResponse<ProjectResponse>>(
    "/projects/",
    {},
    { page: 1, size: 100 },
  );

  const rows = unwrapList(payload);

  return rows.map((row) => ({
    project_id: String(row.project_id),
    project_code:
      row.project_code ?? `PRJ-${String(row.project_id).slice(0, 8).toUpperCase()}`,
    project_title: row.project_title ?? "Untitled Project",
    sector_name: row.sector_name ?? row.sector?.sector_name ?? undefined,
  }));
}

// A project id can be provided when a screen only needs one project's issue feed.
export async function getIssues(projectId?: string): Promise<IssueItem[]> {
  if (projectId) {
    return getProjectIssues(projectId);
  }

  const payload = await requestJson<ListResponse<IssueApiResponse>>("/issues/", {}, { page: 1, size: 100 });
  return unwrapList(payload).map(normalizeIssue);
}

export async function getProjectIssues(projectId: string): Promise<IssueItem[]> {
  const payload = await requestJson<ListResponse<IssueApiResponse>>(
    `/issues/project/${projectId}`,
  );

  return unwrapList(payload).map(normalizeIssue);
}

export const getIssuesByProject = getProjectIssues;

export async function createIssue(
  projectIdOrPayload: string | CreateIssuePayload,
  payload?: Omit<CreateIssuePayload, "project_id">,
): Promise<IssueItem> {
  const requestPayload =
    typeof projectIdOrPayload === "string"
      ? { ...payload, project_id: projectIdOrPayload }
      : projectIdOrPayload;

  const row = await requestJson<IssueApiResponse>("/issues/", {
    method: "POST",
    body: JSON.stringify(requestPayload),
  });

  return normalizeIssue(row);
}

export async function resolveIssue(
  issueId: string,
  payload: ResolveIssuePayload,
): Promise<IssueItem> {
  const row = await requestJson<IssueApiResponse>(`/issues/${issueId}/resolve`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return normalizeIssue(row);
}