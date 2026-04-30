import { useEffect, useMemo, useState } from "react";
import "@/styles/materialSymbols.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { IssueItem } from "@/services/issues.service";

interface ResolveIssueModalProps {
  open: boolean;
  issues: IssueItem[];
  resolvedBy: string;
  submitting?: boolean;
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    issue_id: string;
    corrective_action: string;
    resolved_date: string;
    resolved_by: string;
  }) => Promise<void>;
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20";

function formatDate(value?: string | null) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function ResolveIssueModal({
  open,
  issues,
  resolvedBy,
  submitting = false,
  error,
  onOpenChange,
  onSubmit,
}: ResolveIssueModalProps) {
  const openIssues = useMemo(
    () => issues.filter((issue) => issue.status === "Open"),
    [issues],
  );

  const [selectedIssueId, setSelectedIssueId] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [resolvedDate, setResolvedDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  useEffect(() => {
    if (!open) return;
    setSelectedIssueId(openIssues[0]?.issue_id ?? "");
    setCorrectiveAction("");
    setResolvedDate(new Date().toISOString().slice(0, 10));
  }, [open, openIssues]);

  const selectedIssue =
    openIssues.find((issue) => issue.issue_id === selectedIssueId) ?? null;

  const canSave = Boolean(
    selectedIssueId && correctiveAction.trim() && resolvedDate && !submitting,
  );

  const handleSubmit = async () => {
    if (!canSave) return;

    await onSubmit({
      issue_id: selectedIssueId,
      corrective_action: correctiveAction.trim(),
      resolved_date: resolvedDate,
      resolved_by: resolvedBy,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border/60 bg-muted px-8 py-6">
          <DialogTitle className="text-2xl font-black tracking-tight">
            Resolve Project Issues
          </DialogTitle>
          <DialogDescription>
            Select an open issue, add the corrective action, and mark it as resolved.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-8 py-6">
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </div>
          ) : null}

          <div className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground">
              Open Issues
            </label>

            {openIssues.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                No open issues found for this project.
              </div>
            ) : (
              <div className="space-y-3">
                {openIssues.map((issue) => {
                  const active = issue.issue_id === selectedIssueId;

                  return (
                    <label
                      key={issue.issue_id}
                      className={`relative flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition ${
                        active
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:bg-muted/40"
                      }`}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="selectedIssue"
                        checked={active}
                        onChange={() => setSelectedIssueId(issue.issue_id)}
                      />

                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          active ? "border-primary" : "border-border"
                        }`}
                      >
                        <div
                          className={`h-2 w-2 rounded-full ${
                            active ? "bg-primary" : "bg-transparent"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-foreground">
                          {issue.issue_category} - {issue.issue_name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          ID: {issue.issue_id} • {formatDate(issue.date_reported)} • Open
                        </span>
                      </div>

                      {active ? (
                        <span className="material-symbols-outlined text-primary">
                          check_circle
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Selected Issue
            </label>
            <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm">
              {selectedIssue
                ? `${selectedIssue.issue_category} - ${selectedIssue.issue_name}`
                : "No issue selected"}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Corrective Action Taken <span className="text-destructive">*</span>
            </label>
            <textarea
              className={`${inputClass} min-h-32 resize-none`}
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              placeholder="Describe the steps taken to mitigate the issue and prevent recurrence..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Resolved Date
              </label>
              <input
                className={inputClass}
                type="date"
                value={resolvedDate}
                onChange={(e) => setResolvedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Resolved By
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground">
                <span className="material-symbols-outlined text-sm text-muted-foreground">
                  verified_user
                </span>
                <span>{resolvedBy}</span>
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
            {submitting ? "Saving..." : "Mark as Resolved"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}