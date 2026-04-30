import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { IssueProjectOption } from "@/services/issues.service";

export type IssueSeverity = "low" | "medium" | "high" | "critical";

interface IssueLogModalProps {
  open: boolean;
  projectId?: string;
  projectLabel?: string;
  projects?: IssueProjectOption[];
  submitting?: boolean;
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    project_id: string;
    issue_name: string;
    issue_category: IssueSeverity;
    issue_description: string;
    date_reported: string;
  }) => Promise<void>;
}

const SEVERITIES: { label: string; value: IssueSeverity }[] = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Critical", value: "critical" },
];

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20";

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export default function IssueLogModal({
  open,
  projectId,
  projectLabel,
  projects,
  submitting = false,
  error,
  onOpenChange,
  onSubmit,
}: IssueLogModalProps) {
  const [issueName, setIssueName] = useState("");
  const [issueCategory, setIssueCategory] = useState<IssueSeverity>("medium");
  const [issueDescription, setIssueDescription] = useState("");
  const [reportedDate, setReportedDate] = useState(todayISODate());
  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? "");

  const activeProjectId = projectId ?? selectedProjectId ?? "";
  const selectedProject = projects?.find((project) => project.project_id === activeProjectId);

  useEffect(() => {
    if (!open) return;
    setIssueName("");
    setIssueCategory("medium");
    setIssueDescription("");
    setReportedDate(todayISODate());
    setSelectedProjectId(projectId ?? projects?.[0]?.project_id ?? "");
  }, [open, projectId, projects]);

  const canSave = useMemo(() => {
    return Boolean(
      (activeProjectId ?? "").trim() &&
        issueName.trim() &&
        issueCategory.trim() &&
        issueDescription.trim() &&
        reportedDate &&
        !submitting,
    );
  }, [activeProjectId, issueName, issueCategory, issueDescription, reportedDate, submitting]);

  const handleSubmit = async () => {
    if (!canSave) return;
    if (!activeProjectId) {
      return;
    }

    await onSubmit({
      project_id: activeProjectId,
      issue_name: issueName.trim(),
      issue_category: issueCategory,
      issue_description: issueDescription.trim(),
      date_reported: reportedDate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border/60 bg-muted px-8 py-6">
          <DialogTitle className="text-2xl font-black tracking-tight">
            Log New Risk or Issue
          </DialogTitle>
          <DialogDescription>
            {projectLabel ?? selectedProject?.project_title
              ? `Project: ${projectLabel ?? selectedProject?.project_title}`
              : "Choose a project and describe the issue for monitoring."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-8 py-6">
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </div>
          ) : null}

          {!projectId && projects ? (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Project
              </label>
              <select
                className={inputClass}
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {projects.map((project) => (
                  <option key={project.project_id} value={project.project_id}>
                    {project.project_code} - {project.project_title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Issue Name
            </label>
            <input
              className={inputClass}
              value={issueName}
              onChange={(e) => setIssueName(e.target.value)}
              placeholder="Enter the issue name..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Severity
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SEVERITIES.map((option) => {
                const active = issueCategory === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setIssueCategory(option.value)}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Issue Description
            </label>
            <textarea
              className={`${inputClass} min-h-36 resize-none`}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Describe the risk or observed issue in detail..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Date Reported
              </label>
              <input
                className={inputClass}
                type="date"
                value={reportedDate}
                onChange={(e) => setReportedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Project UUID
              </label>
              <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm font-mono text-foreground">
                {activeProjectId || "No project selected"}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted px-8 py-5">
          <button
            type="button"
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-bold text-foreground transition hover:bg-background"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-primary px-5 py-2 text-sm font-black text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => void handleSubmit()}
            disabled={!canSave}
          >
            {submitting ? "Saving..." : "Log Issue"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}