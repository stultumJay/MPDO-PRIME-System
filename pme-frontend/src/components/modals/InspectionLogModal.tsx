import { useState } from "react";

interface InspectionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  previousCompletion?: number;
}

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 " +
  "placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white";

const PHASES_MOCK = [
  { id: "planning",     label: "Planning",     current: 100 },
  { id: "procurement",  label: "Procurement",  current: 80  },
  { id: "construction", label: "Construction", current: 45  },
  { id: "testing",      label: "Testing",      current: 0   },
];

export default function InspectionLogModal({
  isOpen,
  onClose,
  previousCompletion = 54.2,
}: InspectionLogModalProps) {
  const [inspectionType, setInspectionType]   = useState("Routine");
  const [inspector, setInspector]             = useState("");
  const [inspectionDate, setInspectionDate]   = useState("");
  const [overallCompletion, setOverallCompletion] = useState(previousCompletion);
  const [phaseUpdates, setPhaseUpdates]       = useState<Record<string, string>>(
    Object.fromEntries(PHASES_MOCK.map((p) => [p.id, String(p.current)]))
  );
  const [findings, setFindings]               = useState("");
  const [recommendations, setRecommendations] = useState("");

  if (!isOpen) return null;

  const canSave = inspector.trim() && findings.trim() && inspectionDate &&
    overallCompletion >= previousCompletion;

  const handlePhaseUpdate = (id: string, val: string) => {
    const num = parseFloat(val);
    const prev = PHASES_MOCK.find((p) => p.id === id)?.current ?? 0;
    if (!isNaN(num) && num >= prev && num <= 100) {
      setPhaseUpdates((p) => ({ ...p, [id]: val }));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,15,30,0.65)", backdropFilter: "blur(3px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-gray-900">Log Physical Progress / Inspection</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Record site inspection findings and update completion percentage
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-gray-500 text-xl leading-none ml-4"
            aria-label="Close inspection modal"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-5 space-y-4 overflow-y-auto">

          {/* Forward-only notice */}
          <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50">
            <span className="text-amber-500 text-sm mt-0.5">⚠</span>
            <p className="text-[10px] text-amber-800">
              Completion percentage can only move <strong>forward</strong>. Previous overall: <strong>{previousCompletion}%</strong>
            </p>
          </div>

          {/* Inspection Date + Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Inspection Date <span className="text-red-400">*</span>
              </label>
              <input type="date" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} className={inputCls} />
              <p className="text-[9px] text-gray-400 mt-1">Actual date of site inspection.</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Inspection Type <span className="text-red-400">*</span>
              </label>
              <select value={inspectionType} onChange={(e) => setInspectionType(e.target.value)} className={inputCls}>
                {["Routine", "Milestone", "Final / Completion", "Emergency / Incident"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Inspector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Inspector / Reported By <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={inspector}
              onChange={(e) => setInspector(e.target.value)}
              placeholder="Full name of inspector or engineer…"
              className={inputCls}
            />
          </div>

          {/* Overall Completion Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Overall Completion % <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={overallCompletion}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v >= previousCompletion && v <= 100) {
                      setOverallCompletion(Math.round(v * 10) / 10);
                    }
                  }}
                  min={previousCompletion}
                  max={100}
                  step={0.1}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-400 font-medium">%</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="relative w-full bg-gray-100 rounded-full h-3 mb-1">
              {/* Previous marker */}
              <div
                className="absolute top-0 h-3 rounded-full bg-gray-300"
                style={{ width: `${previousCompletion}%` }}
              />
              {/* New value */}
              <div
                className="absolute top-0 h-3 rounded-full transition-all"
                style={{ width: `${overallCompletion}%`, background: "#0f766e" }}
              />
            </div>
            <input
              type="range"
              min={previousCompletion}
              max={100}
              step={0.1}
              value={overallCompletion}
              onChange={(e) => setOverallCompletion(parseFloat(e.target.value))}
              className="w-full accent-teal-600 mt-1"
            />
            <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
              <span>Previous: {previousCompletion}%</span>
              <span className="font-bold text-teal-600">New: {overallCompletion.toFixed(1)}%</span>
            </div>
          </div>

          {/* Per-Phase Updates */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              Per-Phase Completion (optional)
            </label>
            <div className="space-y-2">
              {PHASES_MOCK.map((phase) => (
                <div key={phase.id} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600 w-24 shrink-0">{phase.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 relative overflow-hidden">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${parseFloat(phaseUpdates[phase.id]) || phase.current}%`,
                        background: "#0f766e",
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-1 w-20">
                    <input
                      type="number"
                      value={phaseUpdates[phase.id]}
                      onChange={(e) => handlePhaseUpdate(phase.id, e.target.value)}
                      min={phase.current}
                      max={100}
                      className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Major Findings */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Major Findings <span className="text-red-400">*</span>
            </label>
            <textarea
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              rows={3}
              placeholder="Current state of work, notable progress, materials on site, workmanship observations…"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Recommendations */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Recommendations
            </label>
            <textarea
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              rows={2}
              placeholder="Suggested actions, areas needing attention…"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Site Photos / Attachments
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors">
              <p className="text-2xl mb-1">📷</p>
              <p className="text-xs font-semibold text-gray-500">Click to upload or drag &amp; drop</p>
              <p className="text-[9px] text-gray-400 mt-0.5">JPG, PNG, PDF — up to 10 MB each</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-7 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button
            disabled={!canSave}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#0f766e" }}
          >
            Save Progress Log
          </button>
        </div>
      </div>
    </div>
  );
}