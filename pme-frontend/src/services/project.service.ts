import { apiBlobRequest, apiRequest, withQuery, type ApiQuery } from "./api";

export type ProjectStatus = "planned" | "in_progress" | "completed" | "delayed";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  delayed: "Delayed",
};

export const PROJECT_STATUS_TONE: Record<ProjectStatus, string> = {
  planned: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-emerald-100 text-emerald-700",
  delayed: "bg-red-100 text-red-700",
};


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
// GET REQUEST
// ─────────────────────────────────────────────
async function requestJson<T>(
  path: string,
  query?: ApiQuery,
): Promise<T> {
  return apiRequest<T>(buildUrl(path, query));
}

// ─────────────────────────────────────────────
// BODY REQUEST (POST/PUT/etc.)
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// CREATE PROJECT OPTIONS
// ─────────────────────────────────────────────
export async function getCreateProjectOptions() {
  return requestJson<{
    sectors: any[];
    offices: any[];
    programs: any[];
  }>("/projects/options");
}

// ─────────────────────────────────────────────
// CREATE PROJECT
// ─────────────────────────────────────────────
export async function createProject(payload: {
  project_title: string;
  project_description?: string;
  program_id: string;
  sector_id: string;
  office_id?: string;
  barangay?: string;
  street?: string;
  latitude?: number;
  longitude?: number;
}) {
  return requestJsonBody<{ project_id: string }>(
    "/projects",
    "POST",
    payload
  );
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "string" ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return fallback;
}

function normalizeStatus(raw: unknown): ProjectStatus {
  const value = asString(raw, "").trim().toLowerCase().replace(/\s+/g, "_");

  if (value === "in_progress" || value === "ongoing") return "in_progress";
  if (value === "completed" || value === "done" || value === "complete") return "completed";
  if (value === "delayed" || value === "late") return "delayed";
  return "planned";
}

function formatLocation(barangay?: unknown, street?: unknown): string {
  const parts = [asString(barangay, ""), asString(street, "")].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export interface ProjectSectorOption {
  sector_id: string;
  sector_name: string;
}

export interface ProjectListItem {
  project_id: string;
  project_code: string;
  project_title: string;
  location: string;
  barangay: string;
  street: string;
  sector_id: string;
  sector_name: string;
  status: ProjectStatus;
  created_at: string;
}

export interface ProjectListPayload {
  total: number;
  items: ProjectListItem[];
  sectors: ProjectSectorOption[];
}

export interface ProjectDetailPayload {
  project: {
    project_id: string;
    project_code: string;
    project_title: string;
    project_description: string;
    barangay: string;
    street: string;
    status: ProjectStatus;
    created_at: string;
    location_lat?: number | null;
    location_lng?: number | null;
    expected_start_date?: string | null;
    expected_end_date?: string | null;
    actual_start_date?: string | null;
    actual_end_date?: string | null;
    is_integrated?: boolean;
    locational_clearance_status?: boolean;
  };
  sector_name: string;
  program_name: string;
  office_name: string;
  created_by_name: string;
  location: string;
  aip_years: number[];
  selected_year: number | null;
  aip_contexts: {
    project_aip_id: string;
    fiscal_year: number;
    aip_reference_code: string;
    performance_id?: string | null;
    performance?: {
      performance_indicator?: string | null;
      target_total?: number;
      target_q1?: number;
      target_q2?: number;
      target_q3?: number;
      target_q4?: number;
      actual_q1?: number;
      actual_q2?: number;
      actual_q3?: number;
      actual_q4?: number;
    };
  }[];
  budget: {
    appropriation_total: number;
    allotment_total: number;
    obligation_total: number;
    disbursement_total: number;
    obligation_free_balance: number;
    disbursement_unpaid: number;
    utilization_percent: number;
    fund_sources: {
      name: string;
      type: string;
      amount: number;
      allotted?: number;
      disbursed?: number;
    }[];
    expense_lines: {
      expense_class: string;
      appropriated: number;
      allotted: number;
      obligated: number;
      disbursed: number;
      unallotted: number;
      unobligated: number;
      accounts_payable: number;
    }[];
  };
  finance_ledger: {
    fund_sources: {
      appr_fund_source_id: string;
      fund_name: string;
      fund_category: string;
      expense_class: string;
      appropriated_amount: number;
      allotted_total: number;
      available_for_allotment: number;
    }[];
    allotments: {
      allotment_id: string;
      appr_fund_source_id: string;
      aro_number: string;
      amount_released: number;
      release_date: string;
      remarks?: string;
      obligated_total: number;
      free_balance: number;
    }[];
    obligations: {
      obligation_id: string;
      allotment_id: string;
      payee: string;
      reference_document: string;
      obligation_amount: number;
      obligation_date: string;
      remarks?: string;
      disbursed_total: number;
      unpaid_balance: number;
    }[];
    disbursements: {
      disbursement_id: string;
      obligation_id: string;
      payment_method: string;
      reference_number?: string;
      disbursement_amount: number;
      disbursement_date: string;
      remarks?: string;
    }[];
  };
  physical_progress: {
    overall_percent: number;
    quarters: { quarter: "Q1" | "Q2" | "Q3" | "Q4"; percent: number }[];
  };
  phases: {
    phase_id?: string;
    phase_name: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    weight_percent: number;
    progress_percent: number;
  }[];
  overall_progress_percent: number;
  issues: {
    issue_id: string;
    issue_title: string;
    severity: "low" | "medium" | "high" | "critical";
    reported_at: string;
    resolved: boolean;
  }[];
  activity: {
    id: string;
    kind: "appropriation" | "allotment" | "obligation" | "disbursement" | "issue";
    title: string;
    detail: string;
    amount?: number;
    actor: string;
    occurred_at: string;
  }[];
  documents: { document_id?: string; name: string; uploaded_at: string }[];
}

type BackendProjectRecord = Record<string, any>;
type BackendIssueRecord = Record<string, any>;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function uniqueBySector(items: ProjectListItem[]): ProjectSectorOption[] {
  const seen = new Map<string, ProjectSectorOption>();

  for (const item of items) {
    if (!seen.has(item.sector_id)) {
      seen.set(item.sector_id, {
        sector_id: item.sector_id,
        sector_name: item.sector_name,
      });
    }
  }

  return [...seen.values()].sort((a, b) =>
    a.sector_name.localeCompare(b.sector_name),
  );
}

function normalizeProjectItem(raw: BackendProjectRecord): ProjectListItem {
  const sectorName =
    asString(raw.sector_name) ||
    asString(raw.sector?.sector_name) ||
    asString(raw.sector?.name) ||
    "—";

  const sectorId =
    asString(raw.sector_id) ||
    asString(raw.sector?.sector_id) ||
    "unknown";

  return {
    project_id: asString(raw.project_id),
    project_code: asString(raw.project_code),
    project_title: asString(raw.project_title),
    barangay: asString(raw.barangay),
    street: asString(raw.street),
    location: formatLocation(raw.barangay, raw.street),
    sector_id: sectorId,
    sector_name: sectorName,
    status: normalizeStatus(raw.status),
    created_at: asString(raw.created_at, new Date().toISOString()),
  };
}

function normalizeIssueSeverity(value: unknown): "low" | "medium" | "high" {
  const text = asString(value, "medium").toLowerCase();
  if (text.includes("high") || text.includes("critical")) return "high";
  if (text.includes("low")) return "low";
  return "medium";
}

function normalizeProjectIssues(rows: BackendIssueRecord[]): ProjectDetailPayload["issues"] {
  return rows.map((row) => ({
    issue_id: asString(row.issue_id),
    issue_title: asString(row.issue_title ?? row.issue_name, "Untitled issue"),
    severity: normalizeIssueSeverity(row.severity),
    reported_at: asString(row.created_at ?? row.date_reported, new Date().toISOString()),
    resolved: asString(row.status).toLowerCase() === "resolved",
  }));
}

function normalizePhaseStatus(raw: unknown, progressPercent: number): string {
  const value = asString(raw, "").trim().toLowerCase().replace(/\s+/g, "_");
  if (value) return value;
  if (progressPercent >= 100) return "completed";
  if (progressPercent > 0) return "in_progress";
  return "upcoming";
}

function buildProjectActivity(
  issues: ProjectDetailPayload["issues"],
  timelineRows: BackendProjectRecord[],
  documentRows: BackendProjectRecord[],
  financeLedger?: BackendProjectRecord,
): ProjectDetailPayload["activity"] {
  const fundSourceRows = Array.isArray(financeLedger?.fund_sources) ? financeLedger.fund_sources : [];
  const allotmentRows = Array.isArray(financeLedger?.allotments) ? financeLedger.allotments : [];
  const obligationRows = Array.isArray(financeLedger?.obligations) ? financeLedger.obligations : [];
  const disbursementRows = Array.isArray(financeLedger?.disbursements) ? financeLedger.disbursements : [];

  const financeEntries: ProjectDetailPayload["activity"] = [
    ...fundSourceRows.map((row: any) => ({
      id: `appropriation-${asString(row.appr_fund_source_id)}`,
      kind: "appropriation" as const,
      title: `${asString(row.fund_name, "Fund Source")} appropriation created`,
      detail: `${asString(row.expense_class, "Budget line")} line authorized for funding.`,
      amount: toNumber(row.appropriated_amount),
      actor: "Finance Router",
      occurred_at: asString(row.created_at, new Date().toISOString()),
    })),
    ...allotmentRows.map((row: any) => ({
      id: `allotment-${asString(row.allotment_id)}`,
      kind: "allotment" as const,
      title: `${asString(row.aro_number, "ARO")} released`,
      detail: row.remarks ? asString(row.remarks) : "Funds released for obligation.",
      amount: toNumber(row.amount_released),
      actor: "Finance Router",
      occurred_at: asString(row.release_date, new Date().toISOString()),
    })),
    ...obligationRows.map((row: any) => ({
      id: `obligation-${asString(row.obligation_id)}`,
      kind: "obligation" as const,
      title: `${asString(row.reference_document, "Obligation")} recorded`,
      detail: `${asString(row.payee, "Payee")} obligated against the release.`,
      amount: toNumber(row.obligation_amount),
      actor: "Finance Router",
      occurred_at: asString(row.obligation_date, new Date().toISOString()),
    })),
    ...disbursementRows.map((row: any) => ({
      id: `disbursement-${asString(row.disbursement_id)}`,
      kind: "disbursement" as const,
      title: `${asString(row.reference_number || row.payment_method, "Disbursement")} paid`,
      detail: row.remarks ? asString(row.remarks) : `Payment released via ${asString(row.payment_method, "cash")}.`,
      amount: toNumber(row.disbursement_amount),
      actor: "Finance Router",
      occurred_at: asString(row.disbursement_date, new Date().toISOString()),
    })),
  ];

  const issueEntries: ProjectDetailPayload["activity"] = issues.map((issue) => ({
    id: issue.issue_id,
    kind: "issue" as const,
    title: issue.issue_title,
    detail: issue.resolved ? "Issue has been resolved." : "Open issue is being monitored.",
    actor: "MPDO User",
    occurred_at: issue.reported_at,
  }));

  const timelineEntries: ProjectDetailPayload["activity"] = timelineRows.map((row: any, index: number) => ({
    id: `timeline-${index}`,
    kind: "issue" as const,
    title: `${asString(row.phase_name, "Project phase")} ${asString(row.status, "updated")}`,
    detail: `Phase window: ${asString(row.planned_start, "-")} to ${asString(row.planned_end, "-")}.`,
    actor: "Project Timeline",
    occurred_at: asString(row.updated_at ?? row.planned_start, new Date().toISOString()),
  }));

  const documentEntries: ProjectDetailPayload["activity"] = documentRows.map((row: any, index: number) => ({
    id: `document-${asString(row.document_id, String(index))}`,
    kind: "issue" as const,
    title: `${asString(row.document_name ?? row.name, "Project document")} added`,
    detail: "A new project document was attached to this record.",
    actor: "Document Tracking",
    occurred_at: asString(row.uploaded_at, new Date().toISOString()),
  }));

  return [...financeEntries, ...issueEntries, ...timelineEntries, ...documentEntries].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  );
}

function normalizeDetail(
  raw: BackendProjectRecord,
  selectedYear?: number,
  projectRecord?: BackendProjectRecord,
  issueRows: BackendIssueRecord[] = [],
  phaseRows: BackendProjectRecord[] = [],
  financeSummary?: BackendProjectRecord,
  financeLedger?: BackendProjectRecord,
): ProjectDetailPayload {
  const projectRaw = {
    ...(raw.project ?? {}),
    ...(projectRecord ?? raw),
  };
  const fiscalYearsRaw = Array.isArray(raw.fiscal_years) ? raw.fiscal_years : [];
  const aipContextsRaw = Array.isArray(raw.aip_contexts) ? raw.aip_contexts : [];
  const aipYears = fiscalYearsRaw
    .map((item: any) => toNumber(item?.fiscal_year ?? item))
    .filter((item: number) => item > 0);
  const selected =
    selectedYear ??
    (() => {
      const selectedFromApi = toNumber(raw.selected_year, 0);
      if (selectedFromApi > 0) return selectedFromApi;
      return aipYears[0] ?? null;
    })();
  const physicalProgressRows = Array.isArray(raw.physical_progress)
    ? raw.physical_progress
    : [];
  const timelineRows = Array.isArray(raw.timeline) ? raw.timeline : [];
  const phases =
    physicalProgressRows.length > 0
      ? physicalProgressRows.map((row: any) => {
          const phaseName = asString(row.phase ?? row.phase_name, "Phase");
          const configured = phaseRows.find((phase) => asString(phase.phase_name) === phaseName);
          const phaseId = configured?.phase_id ?? row.phase_id;
          const progressPercent = toNumber(row.percent ?? row.progress_percent, 0);
          const timeline = timelineRows.find((item: any) => asString(item.phase_name) === phaseName);

          return {
            phase_id: phaseId ? asString(phaseId) : undefined,
            phase_name: phaseName,
            status: normalizePhaseStatus(timeline?.status, progressPercent),
            start_date: timeline?.planned_start ? asString(timeline.planned_start) : "",
            end_date: timeline?.planned_end ? asString(timeline.planned_end) : "",
            weight_percent: toNumber(configured?.weight_percent, 0),
            progress_percent: progressPercent,
          };
        })
      : phaseRows.map((phase) => ({
          phase_id: phase.phase_id ? asString(phase.phase_id) : undefined,
          phase_name: asString(phase.phase_name, "Phase"),
          status: normalizePhaseStatus(undefined, 0),
          start_date: "",
          end_date: "",
          weight_percent: toNumber(phase.weight_percent, 0),
          progress_percent: 0,
        }));
  const overallProgress = phases.length
    ? phases.reduce((total, phase) => total + phase.progress_percent, 0) / phases.length
    : 0;
  const financials = raw.financials ?? {};
  const financeLines = Array.isArray(financeSummary?.lines) ? financeSummary.lines : [];
  const expenseLines = financeLines.map((line: any) => ({
    expense_class: asString(line.expense_class, "N/A"),
    appropriated: toNumber(line.appropriated),
    allotted: toNumber(line.allotted),
    obligated: toNumber(line.obligated),
    disbursed: toNumber(line.disbursed),
    unallotted: toNumber(line.unallotted),
    unobligated: toNumber(line.unobligated),
    accounts_payable: toNumber(line.accounts_payable),
  }));
  const appropriation = toNumber(financeSummary?.total_appropriated, toNumber(financials.appropriation));
  const allotted = toNumber(financeSummary?.total_allotted, toNumber(financials.allotted));
  const obligated = toNumber(financeSummary?.total_obligated, toNumber(financials.obligated));
  const disbursement = toNumber(financeSummary?.total_disbursed, toNumber(financials.disbursement));
  const documentRows = Array.isArray(raw.documents) ? raw.documents : [];
  const issues = normalizeProjectIssues(issueRows);
  const ledgerFundSources = Array.isArray(financeLedger?.fund_sources)
    ? financeLedger.fund_sources
    : [];
  const ledgerAllotments = Array.isArray(financeLedger?.allotments)
    ? financeLedger.allotments
    : [];
  const ledgerObligations = Array.isArray(financeLedger?.obligations)
    ? financeLedger.obligations
    : [];
  const ledgerDisbursements = Array.isArray(financeLedger?.disbursements)
    ? financeLedger.disbursements
    : [];
  const normalizedLedger = {
    fund_sources: ledgerFundSources.map((row: any) => ({
      appr_fund_source_id: asString(row.appr_fund_source_id),
      fund_name: asString(row.fund_name, "Fund Source"),
      fund_category: asString(row.fund_category, "Fund"),
      expense_class: asString(row.expense_class, "N/A"),
      appropriated_amount: toNumber(row.appropriated_amount),
      allotted_total: toNumber(row.allotted_total),
      available_for_allotment: toNumber(row.available_for_allotment),
    })),
    allotments: ledgerAllotments.map((row: any) => ({
      allotment_id: asString(row.allotment_id),
      appr_fund_source_id: asString(row.appr_fund_source_id),
      aro_number: asString(row.aro_number, "ARO"),
      amount_released: toNumber(row.amount_released),
      release_date: asString(row.release_date, new Date().toISOString()),
      remarks: row.remarks ? asString(row.remarks) : undefined,
      obligated_total: toNumber(row.obligated_total),
      free_balance: toNumber(row.free_balance),
    })),
    obligations: ledgerObligations.map((row: any) => ({
      obligation_id: asString(row.obligation_id),
      allotment_id: asString(row.allotment_id),
      payee: asString(row.payee, "Payee"),
      reference_document: asString(row.reference_document, "Reference"),
      obligation_amount: toNumber(row.obligation_amount),
      obligation_date: asString(row.obligation_date, new Date().toISOString()),
      remarks: row.remarks ? asString(row.remarks) : undefined,
      disbursed_total: toNumber(row.disbursed_total),
      unpaid_balance: toNumber(row.unpaid_balance),
    })),
    disbursements: ledgerDisbursements.map((row: any) => ({
      disbursement_id: asString(row.disbursement_id),
      obligation_id: asString(row.obligation_id),
      payment_method: asString(row.payment_method, "cash"),
      reference_number: row.reference_number ? asString(row.reference_number) : undefined,
      disbursement_amount: toNumber(row.disbursement_amount),
      disbursement_date: asString(row.disbursement_date, new Date().toISOString()),
      remarks: row.remarks ? asString(row.remarks) : undefined,
    })),
  };
  const fundSourceTotals = new Map<
    string,
    { name: string; type: string; amount: number; allotted: number; disbursed: number }
  >();
  const sourceIdToGroupKey = new Map<string, string>();
  const allotmentIdToSourceId = new Map<string, string>();
  const obligationIdToAllotmentId = new Map<string, string>();

  for (const source of normalizedLedger.fund_sources) {
    const key = source.fund_name.trim().toLowerCase() || source.appr_fund_source_id;
    const existing = fundSourceTotals.get(key);
    if (existing) {
      existing.amount += source.appropriated_amount;
      existing.allotted += source.allotted_total;
      if (!existing.type.includes(source.fund_category)) {
        existing.type = [existing.type, source.fund_category].filter(Boolean).join(", ");
      }
    } else {
      fundSourceTotals.set(key, {
        name: source.fund_name,
        type: source.fund_category,
        amount: source.appropriated_amount,
        allotted: source.allotted_total,
        disbursed: 0,
      });
    }
    sourceIdToGroupKey.set(source.appr_fund_source_id, key);
  }

  for (const allotment of normalizedLedger.allotments) {
    allotmentIdToSourceId.set(allotment.allotment_id, allotment.appr_fund_source_id);
  }

  for (const obligation of normalizedLedger.obligations) {
    obligationIdToAllotmentId.set(obligation.obligation_id, obligation.allotment_id);
  }

  for (const disbursementRow of normalizedLedger.disbursements) {
    const allotmentId = obligationIdToAllotmentId.get(disbursementRow.obligation_id);
    const sourceId = allotmentId ? allotmentIdToSourceId.get(allotmentId) : undefined;
    const groupKey = sourceId ? sourceIdToGroupKey.get(sourceId) : undefined;
    const sourceTotal = groupKey ? fundSourceTotals.get(groupKey) : undefined;
    if (sourceTotal) {
      sourceTotal.disbursed += disbursementRow.disbursement_amount;
    }
  }

  const project = {
    project_id: asString(projectRaw.project_id),
    project_code: asString(projectRaw.project_code),
    project_title: asString(projectRaw.project_title),
    project_description: asString(
      projectRaw.project_description ?? projectRaw.description,
      "No project description available.",
    ),
    barangay: asString(projectRaw.barangay),
    street: asString(projectRaw.street),
    status: normalizeStatus(projectRaw.status),
    created_at: asString(projectRaw.created_at, new Date().toISOString()),
    location_lat: projectRaw.location_lat != null ? toNumber(projectRaw.location_lat) : null,
    location_lng: projectRaw.location_lng != null ? toNumber(projectRaw.location_lng) : null,
    expected_start_date: projectRaw.expected_start_date ? asString(projectRaw.expected_start_date) : null,
    expected_end_date: projectRaw.expected_end_date ? asString(projectRaw.expected_end_date) : null,
    actual_start_date: projectRaw.actual_start_date ? asString(projectRaw.actual_start_date) : null,
    actual_end_date: projectRaw.actual_end_date ? asString(projectRaw.actual_end_date) : null,
    is_integrated: aipContextsRaw.length > 0 || aipYears.length > 0,
    locational_clearance_status: Boolean(
      raw.locational_clearance?.is_clearanced ?? projectRaw.locational_clearance_status ?? false,
    ),
  };

  return {
    project,
    sector_name: asString(raw.sector_name ?? projectRecord?.sector?.sector_name, "Unassigned Sector"),
    program_name: asString(raw.program_name ?? projectRecord?.program?.program_name, "Unassigned Program"),
    office_name: asString(raw.office_name ?? projectRecord?.office?.office_name, "Unassigned Office"),
    created_by_name: asString(raw.created_by_name, "System"),
    location: formatLocation(project.barangay, project.street),
    aip_years: aipYears,
    selected_year: selected,
    aip_contexts: aipContextsRaw.map((row: any) => ({
      project_aip_id: asString(row.project_aip_id),
      fiscal_year: toNumber(row.fiscal_year),
      aip_reference_code: asString(row.aip_reference_code),
      performance_id: row.performance_id ? asString(row.performance_id) : null,
      performance: row.performance
        ? {
            performance_indicator: row.performance.performance_indicator
              ? asString(row.performance.performance_indicator)
              : null,
            target_total: toNumber(row.performance.target_total),
            target_q1: toNumber(row.performance.target_q1),
            target_q2: toNumber(row.performance.target_q2),
            target_q3: toNumber(row.performance.target_q3),
            target_q4: toNumber(row.performance.target_q4),
            actual_q1: toNumber(row.performance.actual_q1),
            actual_q2: toNumber(row.performance.actual_q2),
            actual_q3: toNumber(row.performance.actual_q3),
            actual_q4: toNumber(row.performance.actual_q4),
          }
        : undefined,
    })),
    budget: {
      appropriation_total: appropriation,
      allotment_total: allotted,
      obligation_total: obligated,
      disbursement_total: disbursement,
      obligation_free_balance: Math.max(0, allotted - obligated),
      disbursement_unpaid: Math.max(0, obligated - disbursement),
      utilization_percent: allotted > 0 ? Math.round((disbursement / allotted) * 1000) / 10 : 0,
      fund_sources: fundSourceTotals.size
        ? [...fundSourceTotals.values()].filter((source) => source.amount > 0)
        : expenseLines
            .filter((line) => line.appropriated > 0)
            .map((line) => ({
              name: line.expense_class,
              type: "Expense Class",
              amount: line.appropriated,
              allotted: line.allotted,
              disbursed: line.disbursed,
            })),
      expense_lines: expenseLines,
    },
    finance_ledger: normalizedLedger,
    physical_progress: {
      overall_percent: Math.round(overallProgress * 10) / 10,
      quarters: [
        { quarter: "Q1", percent: Math.round(overallProgress * 0.35) },
        { quarter: "Q2", percent: Math.round(overallProgress * 0.6) },
        { quarter: "Q3", percent: Math.round(overallProgress * 0.85) },
        { quarter: "Q4", percent: Math.round(overallProgress) },
      ],
    },
    phases,
    overall_progress_percent: Math.round(overallProgress * 10) / 10,
    issues,
    activity: buildProjectActivity(issues, timelineRows, documentRows, financeLedger),
    documents: documentRows.map((doc: any) => ({
      document_id: doc.document_id ? asString(doc.document_id) : undefined,
      name: asString(doc.document_name ?? doc.name, "Project document"),
      uploaded_at: asString(doc.uploaded_at, new Date().toISOString()),
    })),
  };
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
export async function getProjects(params: {
  q?: string;
  sectorId?: string;
  status?: ProjectStatus | "all";
  fiscalYear?: number;
  officeId?: string;
  page?: number;
  size?: number;
} = {}): Promise<ProjectListPayload> {
  const raw = await requestJson<BackendProjectRecord[]>("/projects/find", {
    q: params.q,
    sector_id: params.sectorId,
    status: params.status && params.status !== "all" ? params.status : undefined,
    fiscal_year: params.fiscalYear,
    office_id: params.officeId,
    page: params.page ?? 1,
    size: params.size ?? 10,
  });

  const items = Array.isArray(raw) ? raw.map(normalizeProjectItem) : [];

  return {
    total: items.length,
    items,
    sectors: uniqueBySector(items),
  };
}

export async function getProjectById(projectId: string): Promise<ProjectListItem> {
  const raw = await requestJson<BackendProjectRecord>(`/projects/${projectId}`);
  return normalizeProjectItem(raw);
}

export async function updateProject(
  projectId: string,
  payload: {
    project_title?: string;
    project_description?: string | null;
    barangay?: string | null;
    street?: string | null;
    location_lat?: number | null;
    location_lng?: number | null;
    expected_start_date?: string | null;
    expected_end_date?: string | null;
    actual_start_date?: string | null;
    actual_end_date?: string | null;
    status?: ProjectStatus;
  },
) {
  return requestJsonBody<BackendProjectRecord>(`/projects/${projectId}`, "PUT", payload);
}

export async function deleteProject(projectId: string) {
  return requestJsonBody<{ detail: string }>(`/projects/${projectId}`, "DELETE");
}

export async function getProjectDetail(
  projectId: string,
  year?: number,
): Promise<ProjectDetailPayload> {
  try {
    const [raw, projectRecord, phaseRows, financeSummary, financeLedger] = await Promise.all([
      requestJson<BackendProjectRecord>(`/projects/${projectId}/full`, { year }).catch(() => undefined),
      requestJson<BackendProjectRecord>(`/projects/${projectId}`),
      requestJson<BackendProjectRecord[]>("/phase-configs/").catch(() => []),
      requestJson<BackendProjectRecord>(`/finance/projects/${projectId}/summary`).catch(() => undefined),
      requestJson<BackendProjectRecord>(`/finance/projects/${projectId}/ledger`).catch(() => undefined),
    ]);

    return normalizeDetail(raw ?? projectRecord, year, projectRecord, [], phaseRows, financeSummary, financeLedger);
  } catch {
    const raw = await requestJson<BackendProjectRecord>(`/projects/${projectId}`);
    return normalizeDetail(raw, year);
  }
}

export async function createProjectProgress(payload: {
  project_id: string;
  phase_id: string;
  new_percent: number;
  remarks?: string;
}) {
  return requestJsonBody("/progress/", "POST", payload);
}

export async function createProjectAllotment(payload: {
  appr_fund_source_id: string;
  aro_number: string;
  amount_released: number;
  release_date: string;
  remarks?: string;
}) {
  return requestJsonBody("/allotments/", "POST", payload);
}

export async function createProjectObligation(payload: {
  allotment_id: string;
  payee: string;
  reference_document: string;
  obligation_amount: number;
  obligation_date: string;
  remarks?: string;
}) {
  return requestJsonBody("/obligations/", "POST", payload);
}

export async function createProjectDisbursement(payload: {
  obligation_id: string;
  payment_method: string;
  reference_number?: string;
  disbursement_amount: number;
  disbursement_date: string;
  remarks?: string;
}) {
  return requestJsonBody("/disbursements/", "POST", payload);
}

export async function updateProjectTimeline(
  projectId: string,
  phaseName: string,
  payload: { planned_start?: string | null; planned_end?: string | null },
) {
  return requestJsonBody(
    `/projects/${encodeURIComponent(projectId)}/timeline/${encodeURIComponent(phaseName)}`,
    "PUT",
    payload,
  );
}

export async function downloadProjectDocument(projectId: string, documentId: string) {
  return apiBlobRequest(
    `/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}/download`,
  );
}
