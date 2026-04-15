import { useState } from "react";

interface IssueLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ISSUE_TYPES = [
  "Weather Delay",
  "Contractor / Supplier Issue",
  "Budget Shortfall",
  "Technical / Engineering Issue",
  "Procurement Delay",
  "Site Access Problem",
  "Material Shortage",
  "Environmental Issue",
  "Force Majeure",
  "Other",
];

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 " +
  "placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white";

const SEVERITY_CONFIG = {
  Low:      { bg: "bg-blue-100   text-blue-700   border-blue-300"   },
  Medium:   { bg: "bg-amber-100  text-amber-700  border-amber-300"  },
  High:     { bg: "bg-orange-100 text-orange-700 border-orange-300" },
  Critical: { bg: "bg-red-100    text-red-700    border-red-300"    },
};

export default function IssueLogModal({ isOpen, onClose }: IssueLogModalProps) {
  const [issueType, setIssueType]         = useState("");
  const [severity, setSeverity]           = useState<keyof typeof SEVERITY_CONFIG>("Medium");
  const [title, setTitle]                 = useState("");
  const [description, setDescription]    = useState("");
  const [mitigation, setMitigation]      = useState("");
  const [occurrenceDate, setOccurrenceDate] = useState("");
  const [estimatedDelay, setEstimatedDelay] = useState("");
  const [status, setStatus]               = useState("Open");

  if (!isOpen) return null;

  const canSave = issueType && title.trim() && description.trim() && occurrenceDate;

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
            <h2 className="text-lg font-black text-gray-900">Log Issue / Risk</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Record delays, shortages, or risks that may affect this project's timeline or budget
            </p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-xl leading-none ml-4">×</button>
        </div>

        {/* Body */}
        <div className="px-7 py-5 space-y-4 overflow-y-auto">

          {/* Issue Type + Severity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Issue Type <span className="text-red-400">*</span>
              </label>
              <select value={issueType} onChange={(e) => setIssueType(e.target.value)} className={inputCls}>
                <option value="" disabled>Select type…</option>
                {ISSUE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Severity <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-1.5 mt-1">
                {(Object.keys(SEVERITY_CONFIG) as (keyof typeof SEVERITY_CONFIG)[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={`flex-1 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wide transition-all
                      ${severity === s ? SEVERITY_CONFIG[s].bg : "border-gray-200 text-gray-400 hover:border-gray-300"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Issue Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short, descriptive title…"
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What happened, when, and what impact it has on the project…"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Mitigation */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Recommended Action / Mitigation
            </label>
            <textarea
              value={mitigation}
              onChange={(e) => setMitigation(e.target.value)}
              rows={2}
              placeholder="Proposed corrective or mitigation measures…"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Occurrence Date + Estimated Delay + Status */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Date Issue Occurred <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={occurrenceDate}
                onChange={(e) => setOccurrenceDate(e.target.value)}
                className={inputCls}
              />
              <p className="text-[9px] text-gray-400 mt-1">
                The actual date, not when it was logged.
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Est. Days Delayed
              </label>
              <input
                type="number"
                value={estimatedDelay}
                onChange={(e) => setEstimatedDelay(e.target.value)}
                placeholder="0"
                min="0"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Status
              </label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                {["Open", "In Progress", "Resolved", "Closed"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
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
            Save Issue
          </button>
        </div>
      </div>
    </div>
  );
}