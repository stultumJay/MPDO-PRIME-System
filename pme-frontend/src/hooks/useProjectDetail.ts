import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProjectProgress,
  getProjectDetail as getProjectDetailRequest,
  updateProjectTimeline,
  updateProject,
  type ProjectDetailPayload,
} from "@/services/project.service";
import {
  createIssue,
  getProjectIssues,
  resolveIssue,
  type CreateIssuePayload,
  type ResolveIssuePayload,
} from "@/services/issues.service";
import { getAipByProject } from "@/services/aip.service";
import {
  createAipEntry,
  getAllotments,
  getAppropriationFundSources,
  getAppropriations,
  getDisbursements,
  getFundSources,
  getObligations,
  getProjectFinancialSummary,
  type AddToAipPayload,
  type AllotmentOption,
  type AppropriationFundSourceOption,
  type CurrentAppropriationInfo,
  type FundSourceOption,
  type ObligationOption,
  type ProjectFinancialSummary,
} from "@/services/projectActions.service";
import { formatPHPFull } from "@/lib/format";

export const projectKeys = {
  detail: (projectId: string, year?: number) => ["project", projectId, "detail", year] as const,
  aip: (projectId: string, year?: number) => ["project", projectId, "aip", year] as const,
  issues: (projectId: string) => ["project", projectId, "issues"] as const,
  financialSummary: (projectId: string) => ["project", projectId, "financial-summary"] as const,
  financeModalData: (projectId: string, projectAipId?: string) =>
    ["project", projectId, "finance-modal-data", projectAipId] as const,
};

export interface ProjectFinanceModalData {
  fundSources: FundSourceOption[];
  appropriation?: CurrentAppropriationInfo;
  appropriationFundSources: AppropriationFundSourceOption[];
  allotments: AllotmentOption[];
  obligations: ObligationOption[];
  unreleasedTotal: number;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function emptyFinanceModalData(): ProjectFinanceModalData {
  return {
    fundSources: [],
    appropriation: undefined,
    appropriationFundSources: [],
    allotments: [],
    obligations: [],
    unreleasedTotal: 0,
  };
}

// Compose only the data finance modals need, using the real backend routers.
async function getProjectFinanceModalData(projectId: string, projectAipId?: string) {
  // The project id is part of the query identity; the nested finance routers key off the AIP id.
  void projectId;
  const fundSourceRows = await getFundSources();
  const fundSources = fundSourceRows.map((fs) => ({
    fund_source_id: String(fs.fund_source_id),
    fund_name: String(fs.fund_name ?? "Fund Source"),
  }));

  if (!projectAipId) {
    return { ...emptyFinanceModalData(), fundSources };
  }

  const appropriations = await getAppropriations(projectAipId);
  const appropriation = appropriations[0];

  if (!appropriation) {
    return { ...emptyFinanceModalData(), fundSources };
  }

  const fundSourceNameMap = new Map(
    fundSourceRows.map((fs) => [String(fs.fund_source_id), String(fs.fund_name ?? "Fund Source")]),
  );
  const apprRows = await getAppropriationFundSources(appropriation.appropriation_id);
  const appropriationFundSources: AppropriationFundSourceOption[] = [];
  const allotments: AllotmentOption[] = [];
  const obligations: ObligationOption[] = [];
  let unreleasedTotal = 0;

  for (const apprRow of apprRows) {
    const apprFundSourceId = String(apprRow.appr_fund_source_id);
    const appropriatedAmount = asNumber(apprRow.appropriated_amount);
    const allotmentRows = await getAllotments(apprFundSourceId);
    let releasedTotal = 0;

    for (const allotmentRow of allotmentRows) {
      const allotmentId = String(allotmentRow.allotment_id);
      const amountReleased = asNumber(allotmentRow.amount_released);
      releasedTotal += amountReleased;

      const obligationRows = await getObligations(allotmentId);
      let obligatedTotal = 0;

      for (const obligationRow of obligationRows) {
        const obligationId = String(obligationRow.obligation_id);
        const obligationAmount = asNumber(obligationRow.obligation_amount);
        obligatedTotal += obligationAmount;

        const disbursementRows = await getDisbursements(obligationId);
        const disbursedTotal = disbursementRows.reduce(
          (sum, row) => sum + asNumber(row.disbursement_amount),
          0,
        );

        obligations.push({
          obligation_id: obligationId,
          label:
            obligationRow.reference_document && obligationRow.payee
              ? `${obligationRow.reference_document} - ${obligationRow.payee}`
              : obligationRow.payee || obligationRow.reference_document || "Obligation",
          unpaid: Math.max(0, obligationAmount - disbursedTotal),
        });
      }

      allotments.push({
        allotment_id: allotmentId,
        label: `${allotmentRow.aro_number ?? "ARO"} - ${formatPHPFull(amountReleased)}`,
        free_balance: Math.max(0, amountReleased - obligatedTotal),
      });
    }

    const unreleased = Math.max(0, appropriatedAmount - releasedTotal);
    unreleasedTotal += unreleased;

    appropriationFundSources.push({
      appr_fund_source_id: apprFundSourceId,
      fund_source_id: String(apprRow.fund_source_id),
      expense_class: String(apprRow.expense_class),
      label: `${fundSourceNameMap.get(String(apprRow.fund_source_id)) ?? "Fund Source"} - ${apprRow.expense_class} ${formatPHPFull(appropriatedAmount)}`,
      unreleased,
    });
  }

  return {
    fundSources,
    appropriation: {
      appropriation_id: String(appropriation.appropriation_id ?? ""),
      ao_number: String(appropriation.ao_number ?? ""),
    },
    appropriationFundSources,
    allotments,
    obligations,
    unreleasedTotal,
  };
}

export function useProjectDetail(projectId: string, year?: number) {
  return useQuery({
    queryKey: projectKeys.detail(projectId, year),
    queryFn: () => getProjectDetailRequest(projectId, year),
    enabled: Boolean(projectId),
    staleTime: 60_000,
  });
}

export function useProjectAip(projectId: string, year?: number) {
  return useQuery({
    queryKey: projectKeys.aip(projectId, year),
    queryFn: () => getAipByProject(projectId, year as number),
    enabled: Boolean(projectId && year),
  });
}

export function useProjectFinancialSummary(projectId: string) {
  return useQuery<ProjectFinancialSummary>({
    queryKey: projectKeys.financialSummary(projectId),
    queryFn: () => getProjectFinancialSummary(projectId),
    enabled: Boolean(projectId),
    staleTime: 60_000,
  });
}

export function useProjectIssues(projectId: string) {
  return useQuery({
    queryKey: projectKeys.issues(projectId),
    queryFn: () => getProjectIssues(projectId),
    enabled: Boolean(projectId),
    staleTime: 60_000,
  });
}

export function useProjectFinanceModalData(
  projectId: string,
  projectAipId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: projectKeys.financeModalData(projectId, projectAipId),
    queryFn: () => getProjectFinanceModalData(projectId, projectAipId),
    enabled: Boolean(projectId) && enabled,
    initialData: emptyFinanceModalData,
    staleTime: 60_000,
  });
}

export function useCurrentUserName() {
  return useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return "Project Lead Admin";
      const parsed = JSON.parse(raw);
      return parsed?.full_name ?? parsed?.fullName ?? parsed?.name ?? "Project Lead Admin";
    } catch {
      return "Project Lead Admin";
    }
  }, []);
}

export function useProjectMutations(projectId: string, year?: number) {
  const queryClient = useQueryClient();

  const invalidateProject = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
      queryClient.invalidateQueries({ queryKey: ["aip"] }),
      queryClient.invalidateQueries({ queryKey: ["projects"] }),
    ]);
  };

  return {
    createIssue: useMutation({
      mutationFn: (payload: CreateIssuePayload) => createIssue(projectId, {
        issue_name: payload.issue_name,
        issue_category: payload.issue_category,
        issue_description: payload.issue_description,
        date_reported: payload.date_reported,
      }),
      onSuccess: invalidateProject,
    }),
    resolveIssue: useMutation({
      mutationFn: ({ issueId, payload }: { issueId: string; payload: ResolveIssuePayload }) =>
        resolveIssue(issueId, payload),
      onSuccess: invalidateProject,
    }),
    createProgress: useMutation({
      mutationFn: (payload: { phase_id: string; new_percent: number; remarks?: string }) =>
        createProjectProgress({
          project_id: projectId,
          phase_id: payload.phase_id,
          new_percent: payload.new_percent,
          remarks: payload.remarks,
        }),
      onSuccess: invalidateProject,
    }),
    updateProject: useMutation({
      mutationFn: (payload: Parameters<typeof updateProject>[1]) => updateProject(projectId, payload),
      onSuccess: invalidateProject,
    }),
    updateTimeline: useMutation({
      mutationFn: (payload: { phaseName: string; planned_start?: string | null; planned_end?: string | null }) =>
        updateProjectTimeline(projectId, payload.phaseName, {
          planned_start: payload.planned_start,
          planned_end: payload.planned_end,
        }),
      onSuccess: invalidateProject,
    }),
    addToAip: useMutation({
      mutationFn: (payload: AddToAipPayload) => createAipEntry(payload),
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId, year) }),
          queryClient.invalidateQueries({ queryKey: projectKeys.aip(projectId, year) }),
          invalidateProject(),
        ]);
      },
    }),
    invalidateProject,
  };
}

export type { ProjectDetailPayload };
