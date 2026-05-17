import { useEffect, useMemo, useState } from "react";
import { updateAipPerformance } from "@/services/projectActions.service";
import {
  ModalShell,
  FieldLabel,
  inputCls,
  ModalButton,
} from "./ModalShell";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;

  projectAipId: string;

  projectTitle: string;

  data: {
    performance_indicator?: string;
    target_total?: number;

    target_q1: number;
    target_q2: number;
    target_q3: number;
    target_q4: number;

    actual_q1: number;
    actual_q2: number;
    actual_q3: number;
    actual_q4: number;
  };
}

export default function PhysicalProgressModal({
  open,
  onClose,
  onSuccess,
  projectAipId,
  projectTitle,
  data,
}: Props) {
  const [targetTotal, setTargetTotal] = useState(String(data.target_total || 0));
  const [targetQ1, setTargetQ1] = useState(String(data.target_q1 || 0));
  const [targetQ2, setTargetQ2] = useState(String(data.target_q2 || 0));
  const [targetQ3, setTargetQ3] = useState(String(data.target_q3 || 0));
  const [targetQ4, setTargetQ4] = useState(String(data.target_q4 || 0));
  const [q1, setQ1] = useState(String(data.actual_q1 || 0));
  const [q2, setQ2] = useState(String(data.actual_q2 || 0));
  const [q3, setQ3] = useState(String(data.actual_q3 || 0));
  const [q4, setQ4] = useState(String(data.actual_q4 || 0));

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTargetTotal(String(data.target_total || 0));
    setTargetQ1(String(data.target_q1 || 0));
    setTargetQ2(String(data.target_q2 || 0));
    setTargetQ3(String(data.target_q3 || 0));
    setTargetQ4(String(data.target_q4 || 0));
    setQ1(String(data.actual_q1 || 0));
    setQ2(String(data.actual_q2 || 0));
    setQ3(String(data.actual_q3 || 0));
    setQ4(String(data.actual_q4 || 0));
    setError(null);
  }, [open, data]);

  const toInteger = (value: string) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : NaN;
  };

  const annualTarget = toInteger(targetTotal);
  const targetValues = [targetQ1, targetQ2, targetQ3, targetQ4].map(toInteger);
  const actualValues = [q1, q2, q3, q4].map(toInteger);

  const totalTarget = useMemo(
    () => targetValues.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0),
    [targetValues],
  );

  const totalActual = useMemo(
    () => actualValues.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0),
    [actualValues],
  );

  const targetsAreValid =
    Number.isInteger(annualTarget) &&
    annualTarget > 0 &&
    targetValues.every((value) => Number.isInteger(value) && value >= 0) &&
    totalTarget === annualTarget;
  const actualsAreValid = actualValues.every((value) => Number.isInteger(value) && value >= 0);
  const targetValidationMessage = !Number.isInteger(annualTarget) || annualTarget <= 0
    ? "Annual target must be a positive whole number."
    : !targetValues.every((value) => Number.isInteger(value) && value >= 0)
      ? "Quarterly targets must be non-negative whole numbers."
      : totalTarget !== annualTarget
        ? `Quarterly targets sum to ${totalTarget}, but the annual target is ${annualTarget}. Target changes will not be saved until they match.`
        : null;

  const handleSave = async () => {
    if (!projectAipId) {
      setError("Select an AIP context first before logging physical progress.");
      return;
    }

    if (!actualsAreValid) {
      setError("Actual outputs must be non-negative integers.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const targetPayload = targetsAreValid
        ? {
            target_total: annualTarget,
            target_q1: targetValues[0],
            target_q2: targetValues[1],
            target_q3: targetValues[2],
            target_q4: targetValues[3],
          }
        : {};

      await updateAipPerformance(projectAipId, {
        ...targetPayload,
        actual_q1: actualValues[0],
        actual_q2: actualValues[1],
        actual_q3: actualValues[2],
        actual_q4: actualValues[3],
      });

      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update physical progress.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Physical Progress"
      subtitle={projectTitle}
      size="max-w-3xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <div />
          <div className="flex gap-3">
            <ModalButton variant="secondary" onClick={onClose}>
              Cancel
            </ModalButton>
            <ModalButton onClick={handleSave} disabled={busy}>
              {busy ? "Saving..." : targetsAreValid ? "Save Quarterly Logs" : "Save Actuals Only"}
            </ModalButton>
          </div>
        </div>
      }
    >
      {error ? (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </div>
      ) : null}
      {targetValidationMessage ? (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {targetValidationMessage}
        </div>
      ) : null}
      <div className="mb-6">
        <FieldLabel>Performance Indicator</FieldLabel>
        <div className="bg-muted/40 p-4 rounded-lg text-sm">
          {data.performance_indicator ||
            "Integer outputs completed against quarterly and annual physical targets."}
        </div>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <FieldLabel required>Annual Target Total</FieldLabel>
          <input
            className={`${inputCls} font-mono`}
            type="number"
            min={1}
            step={1}
            value={targetTotal}
            onChange={(event) => setTargetTotal(event.target.value)}
          />
        </div>
        <div className={`rounded-lg border px-4 py-3 text-sm font-bold ${targetsAreValid ? "border-primary/20 bg-primary/10 text-primary" : "border-destructive/20 bg-destructive/5 text-destructive"}`}>
          Quarter Target Sum: {totalTarget}
        </div>
      </div>

      <div className="grid grid-cols-3 text-xs font-bold text-muted-foreground mb-3 px-2">
        <div>QUARTER</div>
        <div className="text-center">TARGET</div>
        <div className="text-center">ACTUAL</div>
      </div>

      <div className="space-y-4">
        <QuarterRow label="Quarter 1" target={targetQ1} actual={q1} onTargetChange={setTargetQ1} onActualChange={setQ1} />
        <QuarterRow label="Quarter 2" target={targetQ2} actual={q2} onTargetChange={setTargetQ2} onActualChange={setQ2} />
        <QuarterRow label="Quarter 3" target={targetQ3} actual={q3} onTargetChange={setTargetQ3} onActualChange={setQ3} />
        <QuarterRow label="Quarter 4" target={targetQ4} actual={q4} onTargetChange={setTargetQ4} onActualChange={setQ4} />
      </div>

      <div className="mt-6 border-t pt-4 flex justify-between items-center px-2">
        <span className="font-semibold text-sm">Annual Total</span>

        <div className="flex gap-10">
          <span className="text-green-600 font-bold">
            {totalTarget}
          </span>
          <span className="text-red-600 font-bold">
            {totalActual}
          </span>
        </div>
      </div>
    </ModalShell>
  );
}

function QuarterRow({
  label,
  target,
  actual,
  onTargetChange,
  onActualChange,
}: {
  label: string;
  target: string;
  actual: string;
  onTargetChange: (value: string) => void;
  onActualChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 items-center gap-3 px-2">
      <div className="text-sm font-medium">{label}</div>
      <input
        type="number"
        min={0}
        step={1}
        className={`${inputCls} text-center font-mono`}
        value={target}
        onChange={(event) => onTargetChange(event.target.value)}
      />
      <input
        type="number"
        min={0}
        step={1}
        className={`${inputCls} text-center font-mono`}
        value={actual}
        onChange={(event) => onActualChange(event.target.value)}
      />
    </div>
  );
}
