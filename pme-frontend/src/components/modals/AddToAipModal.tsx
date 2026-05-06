import { useEffect, useMemo, useState } from "react";
import type { AddToAipPayload } from "@/services/projectActions.service";
import type { ProjectDetailPayload } from "@/services/project.service";
import { formatPHPFull } from "@/lib/format";
import { FieldLabel, ModalButton, ModalShell, inputCls, readonlyInputCls } from "./ModalShell";

interface AddToAipModalProps {
  open: boolean;
  project: ProjectDetailPayload;
  existingYears: number[];
  submitting?: boolean;
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AddToAipPayload) => Promise<void>;
}

export default function AddToAipModal({
  open,
  project,
  existingYears,
  submitting = false,
  error,
  onOpenChange,
  onSubmit,
}: AddToAipModalProps) {
  const nextYear = Math.max(new Date().getFullYear(), ...(existingYears.length ? existingYears : [0])) + 1;
  const [fiscalYear, setFiscalYear] = useState(String(nextYear));
  const [majorFinalOutput, setMajorFinalOutput] = useState("");
  const [indicator, setIndicator] = useState("");
  const [targetTotal, setTargetTotal] = useState("");
  const [ps, setPs] = useState("");
  const [mooe, setMooe] = useState("");
  const [fe, setFe] = useState("");
  const [co, setCo] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!open) return;
    setFiscalYear(String(nextYear));
    setMajorFinalOutput("");
    setIndicator("");
    setTargetTotal("");
    setPs("");
    setMooe("");
    setFe("");
    setCo("");
    setRemarks("");
  }, [open, nextYear]);

  const totalBudget = useMemo(
    () => (Number(ps) || 0) + (Number(mooe) || 0) + (Number(fe) || 0) + (Number(co) || 0),
    [ps, mooe, fe, co],
  );
  const yearNumber = Number(fiscalYear);
  const duplicateYear = existingYears.includes(yearNumber);
  const targetNumber = Number(targetTotal);
  const canSubmit =
    !submitting &&
    yearNumber >= 2000 &&
    !duplicateYear &&
    majorFinalOutput.trim() &&
    indicator.trim() &&
    targetNumber > 0 &&
    totalBudget > 0;

  return (
    <ModalShell
      open={open}
      onClose={() => onOpenChange(false)}
      size="max-w-4xl"
      title="Add to AIP"
      subtitle="Move this planned project into the Annual Investment Program"
      footer={
        <>
          <div className="text-[11px] text-muted-foreground">
            <span className="font-bold uppercase tracking-wider">Total Proposed:</span>{" "}
            <span className="text-sm font-black text-foreground">{formatPHPFull(totalBudget)}</span>
          </div>
          <div className="flex gap-3">
            <ModalButton variant="secondary" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </ModalButton>
            <ModalButton
              disabled={!canSubmit}
              onClick={() =>
                onSubmit({
                  project_id: project.project.project_id,
                  fiscal_year: yearNumber,
                  major_final_output: majorFinalOutput.trim(),
                  performance_indicator: indicator.trim(),
                  target_total: targetNumber,
                  proposed_budget_ps: Number(ps) || 0,
                  proposed_budget_mooe: Number(mooe) || 0,
                  proposed_budget_fe: Number(fe) || 0,
                  proposed_budget_co: Number(co) || 0,
                  performance_remarks: remarks.trim() || undefined,
                })
              }
            >
              {submitting ? "Saving..." : "Add to AIP"}
            </ModalButton>
          </div>
        </>
      }
    >
      <div className="space-y-6">
        {error ? (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <div>
            <FieldLabel>Project Code</FieldLabel>
            <input className={readonlyInputCls} value={project.project.project_code} readOnly />
          </div>
          <div>
            <FieldLabel>Project Title</FieldLabel>
            <input className={readonlyInputCls} value={project.project.project_title} readOnly />
          </div>
          <div>
            <FieldLabel required>Fiscal Year</FieldLabel>
            <input
              className={inputCls}
              type="number"
              min={2000}
              value={fiscalYear}
              onChange={(event) => setFiscalYear(event.target.value)}
            />
            {duplicateYear ? (
              <p className="mt-1 text-[10px] font-bold text-destructive">
                This project already has an active AIP entry for FY {yearNumber}.
              </p>
            ) : null}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div>
            <FieldLabel required>Major Final Output</FieldLabel>
            <textarea className={`${inputCls} h-24 resize-none`} value={majorFinalOutput} onChange={(event) => setMajorFinalOutput(event.target.value)} />
          </div>
          <div>
            <FieldLabel required>Performance Indicator</FieldLabel>
            <textarea className={`${inputCls} h-24 resize-none`} value={indicator} onChange={(event) => setIndicator(event.target.value)} />
          </div>
          <div>
            <FieldLabel required>Target Total</FieldLabel>
            <input className={inputCls} type="number" min={1} value={targetTotal} onChange={(event) => setTargetTotal(event.target.value)} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <BudgetInput label="PS" value={ps} onChange={setPs} />
          <BudgetInput label="MOOE" value={mooe} onChange={setMooe} />
          <BudgetInput label="FE" value={fe} onChange={setFe} />
          <BudgetInput label="CO" value={co} onChange={setCo} />
        </section>

        <div>
          <FieldLabel>Remarks</FieldLabel>
          <textarea className={`${inputCls} h-20 resize-none`} value={remarks} onChange={(event) => setRemarks(event.target.value)} />
        </div>
      </div>
    </ModalShell>
  );
}

function BudgetInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        className={`${inputCls} text-right font-mono`}
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}