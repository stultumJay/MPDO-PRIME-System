import { apiRequest, withQuery } from "./api";

// Finance lookup and transaction types mirror the FastAPI routers one endpoint at a time.
export interface FundSource {
  fund_source_id: string;
  fund_category: string;
  fund_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface AppropriationPayload {
  project_aip_id: string;
  ao_number: string;
  fiscal_year: string;
}

export interface Appropriation {
  appropriation_id: string;
  project_aip_id: string;
  ao_number: string;
}

export interface AppropriationFundSourcePayload {
  appropriation_id: string;
  fund_source_id: string;
  expense_class: string;
  appropriated_amount: number;
}

export interface AppropriationFundSource {
  appr_fund_source_id: string;
  appropriation_id: string;
  fund_source_id: string;
  expense_class: string;
  appropriated_amount: number;
}

export interface AllotmentPayload {
  appr_fund_source_id: string;
  aro_number: string;
  amount_released: number;
  release_date: string;
  remarks?: string;
}

export interface Allotment {
  allotment_id: string;
  appr_fund_source_id: string;
  aro_number: string;
  amount_released: number;
  release_date: string;
  remarks?: string;
}

export interface ObligationPayload {
  allotment_id: string;
  payee: string;
  reference_document: string;
  obligation_amount: number;
  obligation_date: string;
  remarks?: string;
}

export interface Obligation {
  obligation_id: string;
  allotment_id: string;
  payee: string;
  reference_document: string;
  obligation_amount: number;
  obligation_date: string;
  remarks?: string;
}

export interface DisbursementPayload {
  obligation_id: string;
  payment_method: string;
  reference_number?: string;
  disbursement_amount: number;
  disbursement_date: string;
  remarks?: string;
}

export interface Disbursement {
  disbursement_id: string;
  obligation_id: string;
  payment_method: string;
  reference_number?: string;
  disbursement_amount: number;
  disbursement_date: string;
  remarks?: string;
}

export interface ProjectFinancialSummary {
  appropriation_total?: number;
  allotment_total?: number;
  obligation_total?: number;
  disbursement_total?: number;
  total_appropriated?: number;
  total_allotted?: number;
  total_obligated?: number;
  total_disbursed?: number;
  lines?: {
    expense_class: string;
    appropriated: number;
    allotted: number;
    obligated: number;
    disbursed: number;
    unallotted: number;
    unobligated: number;
    accounts_payable: number;
  }[];
}

export interface FundSourceOption {
  fund_source_id: string;
  fund_name: string;
}

export interface AppropriationFundSourceOption {
  appr_fund_source_id: string;
  fund_source_id: string;
  expense_class: string;
  label: string;
  unreleased: number;
}

export interface AllotmentOption {
  allotment_id: string;
  label: string;
  free_balance: number;
}

export interface ObligationOption {
  obligation_id: string;
  label: string;
  unpaid: number;
}

export interface CurrentAppropriationInfo {
  appropriation_id: string;
  ao_number: string;
}

export interface ProgressPayload {
  project_id: string;
  phase_id: string;
  new_percent: number;
  remarks?: string;
}

export interface PerformanceCreatePayload {
  performance_indicator: string;
  target_total: number;
  target_q1?: number;
  target_q2?: number;
  target_q3?: number;
  target_q4?: number;
  remarks?: string;
}

export interface PerformanceUpdatePayload {
  performance_indicator?: string;
  target_total?: number;
  target_q1?: number;
  target_q2?: number;
  target_q3?: number;
  target_q4?: number;
  actual_q1?: number;
  actual_q2?: number;
  actual_q3?: number;
  actual_q4?: number;
  remarks?: string;
}

export interface PerformanceRecord {
  performance_id: string;
  performance_indicator?: string | null;
  target_total?: number | null;
  target_q1?: number | null;
  target_q2?: number | null;
  target_q3?: number | null;
  target_q4?: number | null;
  actual_q1?: number | null;
  actual_q2?: number | null;
  actual_q3?: number | null;
  actual_q4?: number | null;
  remarks?: string | null;
}

export interface AddToAipContext {
  project_id: string;
  project_code: string;
  project_title: string;
  sector_name: string;
  sector_code: string;
  office_name: string;
  office_code: string;
  office_type: number;
  program_name: string;
  program_code: string;
  existing_years: number[];
  next_fiscal_year: number;
}

export interface AddToAipPayload {
  project_id: string;
  fiscal_year: number;
  major_final_output: string;
  performance_indicator: string;
  target_total: number;
  target_q1?: number;
  target_q2?: number;
  target_q3?: number;
  target_q4?: number;
  proposed_budget_ps?: number;
  proposed_budget_mooe?: number;
  proposed_budget_fe?: number;
  proposed_budget_co?: number;
  performance_remarks?: string;
}

export interface AipEntry {
  project_aip_id: string;
  project?: {
    project_id: string;
    project_code: string;
    project_title: string;
    sector?: { sector_id: string; sector_code?: string; sector_name?: string } | null;
    office?: { office_id: string; office_code?: string; office_name?: string; office_type?: number } | null;
  } | null;
  aip_reference_code: string;
  fiscal_year: number;
  is_active: boolean;
}

export function getFundSources() {
  return apiRequest<FundSource[]>("/finance/fund-sources");
}

export function createAppropriation(data: AppropriationPayload) {
  return apiRequest<Appropriation>("/finance/appropriations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getAppropriations(projectAipId?: string) {
  return apiRequest<Appropriation[]>(
    withQuery("/finance/appropriations", { project_aip_id: projectAipId }),
  );
}

export function createAppropriationFundSource(data: AppropriationFundSourcePayload) {
  return apiRequest<AppropriationFundSource>("/finance/appropriation-fund-sources", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getAppropriationFundSources(appropriationId: string) {
  return apiRequest<AppropriationFundSource[]>(
    withQuery("/finance/appropriation-fund-sources", { appropriation_id: appropriationId }),
  );
}

export function createAllotment(data: AllotmentPayload) {
  return apiRequest<Allotment>("/allotments/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getAllotments(apprFundSourceId?: string) {
  return apiRequest<Allotment[]>(
    withQuery("/allotments/", { appr_fund_source_id: apprFundSourceId }),
  );
}

export function createObligation(data: ObligationPayload) {
  return apiRequest<Obligation>("/obligations/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getObligations(allotmentId?: string) {
  return apiRequest<Obligation[]>(withQuery("/obligations/", { allotment_id: allotmentId }));
}

export function createDisbursement(data: DisbursementPayload) {
  return apiRequest<Disbursement>("/disbursements/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getDisbursements(obligationId?: string) {
  return apiRequest<Disbursement[]>(
    withQuery("/disbursements/", { obligation_id: obligationId }),
  );
}

export function getProjectFinancialSummary(projectId: string) {
  return apiRequest<ProjectFinancialSummary>(
    `/finance/projects/${encodeURIComponent(projectId)}/summary`,
  );
}

export function createProgressLog(data: ProgressPayload) {
  return apiRequest("/progress/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createPerformance(data: PerformanceCreatePayload) {
  return apiRequest<PerformanceRecord>("/performances/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getPerformance(performanceId: string) {
  return apiRequest<PerformanceRecord>(`/performances/${encodeURIComponent(performanceId)}`);
}

export function updatePerformance(performanceId: string, data: PerformanceUpdatePayload) {
  return apiRequest<PerformanceRecord>(`/performances/${encodeURIComponent(performanceId)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function createAipEntry(data: AddToAipPayload) {
  return apiRequest<AipEntry>("/aip/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
