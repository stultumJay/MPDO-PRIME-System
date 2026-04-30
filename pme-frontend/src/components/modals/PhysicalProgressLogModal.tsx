import { useEffect, useMemo, useState } from "react";
import { updatePerformance } from "@/services/projectActions.service";
import {
  ModalShell,
  FieldLabel,
  inputCls,
  readonlyInputCls,
  ModalButton,
} from "./ModalShell";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;

  performanceId: string;

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
  performanceId,
  projectTitle,
  data,
}: Props) {
  const [q1, setQ1] = useState(data.actual_q1 || 0);
  const [q2, setQ2] = useState(data.actual_q2 || 0);
  const [q3, setQ3] = useState(data.actual_q3 || 0);
  const [q4, setQ4] = useState(data.actual_q4 || 0);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setQ1(data.actual_q1 || 0);
    setQ2(data.actual_q2 || 0);
    setQ3(data.actual_q3 || 0);
    setQ4(data.actual_q4 || 0);
    setError(null);
  }, [open, data]);

  const totalTarget = useMemo(
    () =>
      (data.target_q1 || 0) +
      (data.target_q2 || 0) +
      (data.target_q3 || 0) +
      (data.target_q4 || 0),
    [data]
  );

  const totalActual = useMemo(
    () => (q1 || 0) + (q2 || 0) + (q3 || 0) + (q4 || 0),
    [q1, q2, q3, q4]
  );

  const handleSave = async () => {
    if (!performanceId) {
      setError("Select an AIP context first before logging physical progress.");
      return;
    }

    if (totalTarget > (data.target_total || totalTarget)) {
      setError("Quarterly targets cannot exceed the total AIP target.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await updatePerformance(performanceId, {
        actual_q1: q1,
        actual_q2: q2,
        actual_q3: q3,
        actual_q4: q4,
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
              {busy ? "Saving..." : "Save Quarterly Logs"}
            </ModalButton>
          </div>
        </div>
      }
    >
      {error ? (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {/* PERFORMANCE INDICATOR */}
      <div className="mb-6">
        <FieldLabel>Performance Indicator</FieldLabel>
        <div className="bg-muted/40 p-4 rounded-lg text-sm">
          {data.performance_indicator ||
            "Percentage of project construction completed against quarterly and annual physical targets."}
        </div>
      </div>

      {/* TABLE HEADER */}
      <div className="grid grid-cols-3 text-xs font-bold text-muted-foreground mb-3 px-2">
        <div>QUARTER</div>
        <div className="text-center">TARGET (%)</div>
        <div className="text-center">ACTUAL (%)</div>
      </div>

      {/* ROWS */}
      <div className="space-y-4">
        {/* Q1 */}
        <div className="grid grid-cols-3 items-center px-2">
          <div className="text-sm font-medium">Quarter 1</div>
          <input
            className={`${readonlyInputCls} text-center`}
            value={data.target_q1}
            readOnly
          />
          <input
            type="number"
            className={`${inputCls} text-center`}
            value={q1}
            onChange={(e) => setQ1(Number(e.target.value))}
          />
        </div>

        {/* Q2 */}
        <div className="grid grid-cols-3 items-center px-2">
          <div className="text-sm font-medium">Quarter 2</div>
          <input
            className={`${readonlyInputCls} text-center`}
            value={data.target_q2}
            readOnly
          />
          <input
            type="number"
            className={`${inputCls} text-center`}
            value={q2}
            onChange={(e) => setQ2(Number(e.target.value))}
          />
        </div>

        {/* Q3 */}
        <div className="grid grid-cols-3 items-center px-2">
          <div className="text-sm font-medium">Quarter 3</div>
          <input
            className={`${readonlyInputCls} text-center`}
            value={data.target_q3}
            readOnly
          />
          <input
            type="number"
            className={`${inputCls} text-center`}
            value={q3}
            onChange={(e) => setQ3(Number(e.target.value))}
          />
        </div>

        {/* Q4 */}
        <div className="grid grid-cols-3 items-center px-2">
          <div className="text-sm font-medium">Quarter 4</div>
          <input
            className={`${readonlyInputCls} text-center`}
            value={data.target_q4}
            readOnly
          />
          <input
            type="number"
            className={`${inputCls} text-center`}
            value={q4}
            onChange={(e) => setQ4(Number(e.target.value))}
          />
        </div>
      </div>

      {/* TOTAL */}
      <div className="mt-6 border-t pt-4 flex justify-between items-center px-2">
        <span className="font-semibold text-sm">Annual Total</span>

        <div className="flex gap-10">
          <span className="text-green-600 font-bold">
            {totalTarget}%
          </span>
          <span className="text-red-600 font-bold">
            {totalActual}%
          </span>
        </div>
      </div>
    </ModalShell>
  );
}