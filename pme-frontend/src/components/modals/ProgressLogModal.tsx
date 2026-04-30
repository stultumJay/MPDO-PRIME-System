import { useEffect, useMemo, useState } from "react";
import "@/styles/materialSymbols.css";
import type { ProjectDetailPayload } from "@/services/project.service";

type PhaseOption = ProjectDetailPayload["phases"][number];

interface ProgressLogModalProps {
  open: boolean;
  phases: PhaseOption[];
  submitting?: boolean;
  error?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { phase_id: string; new_percent: number; remarks?: string }) => void;
}

export default function ProgressLogModal({
  open,
  phases,
  submitting = false,
  error,
  onOpenChange,
  onSubmit,
}: ProgressLogModalProps) {
  const selectablePhases = useMemo(
    () => phases.filter((phase) => Boolean(phase.phase_id)),
    [phases],
  );
  const [phaseId, setPhaseId] = useState("");
  const [percent, setPercent] = useState("0");
  const [remarks, setRemarks] = useState("");

  const selectedPhase = selectablePhases.find((phase) => phase.phase_id === phaseId);
  const currentPercent = selectedPhase?.progress_percent ?? 0;
  const numericPercent = Number(percent);
  const canSubmit =
    Boolean(phaseId) &&
    Number.isFinite(numericPercent) &&
    numericPercent >= currentPercent &&
    numericPercent <= 100 &&
    !submitting;

  useEffect(() => {
    if (!open) return;
    const first = selectablePhases[0];
    setPhaseId(first?.phase_id ?? "");
    setPercent(String(first?.progress_percent ?? 0));
    setRemarks("");
  }, [open, selectablePhases]);

  useEffect(() => {
    const next = selectablePhases.find((phase) => phase.phase_id === phaseId);
    if (next) setPercent(String(next.progress_percent));
  }, [phaseId, selectablePhases]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={(event) => event.target === event.currentTarget && onOpenChange(false)}
    >
      <form
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) return;
          onSubmit({
            phase_id: phaseId,
            new_percent: numericPercent,
            remarks: remarks.trim() || undefined,
          });
        }}
      >
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">
                Physical Monitoring
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                Log Progress Update
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Record forward-only completion changes for a project phase.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          {selectablePhases.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              No editable project phases are available from the backend yet.
            </div>
          ) : null}

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Project Phase
            </span>
            <select
              value={phaseId}
              onChange={(event) => setPhaseId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            >
              {selectablePhases.map((phase) => (
                <option key={phase.phase_id} value={phase.phase_id}>
                  {phase.phase_name} ({phase.progress_percent}%)
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                New Completion
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                Current: {currentPercent}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={currentPercent}
                max={100}
                step="0.1"
                value={percent}
                onChange={(event) => setPercent(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <span className="text-sm font-black text-slate-500">%</span>
            </div>
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Remarks
            </span>
            <textarea
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              rows={3}
              placeholder="Inspection findings, delivery updates, or validation notes"
              className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Progress"}
          </button>
        </div>
      </form>
    </div>
  );
}