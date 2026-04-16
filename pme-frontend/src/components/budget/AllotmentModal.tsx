import { useState } from "react";

interface AllotmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  unreleased?: number;
}

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 " +
  "placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white";

const FUND_SOURCES_MOCK = [
  { id: "FS-001", label: "National Government Fund — CO (Unreleased: ₱1,740,000.00)", unreleased: 1_740_000 },
  { id: "FS-002", label: "LGU Development Fund (20%) — CO (Unreleased: ₱1,160,000.00)", unreleased: 1_160_000 },
];

export default function AllotmentModal({ isOpen, onClose }: AllotmentModalProps) {
  const [aroNumber, setAroNumber]         = useState("");
  const [releaseType, setReleaseType]     = useState("");
  const [quarter, setQuarter]             = useState("");
  const [expenseClass, setExpenseClass]   = useState("");
  const [fundSourceId, setFundSourceId]   = useState("FS-001");
  const [thisRelease, setThisRelease]     = useState("");
  const [releaseDate, setReleaseDate]     = useState("");

  if (!isOpen) return null;

  const selectedFs = FUND_SOURCES_MOCK.find((f) => f.id === fundSourceId);
  const unreleased = selectedFs?.unreleased ?? 0;
  const thisAmt    = parseFloat(thisRelease) || 0;
  const forLater   = Math.max(0, unreleased - thisAmt);
  const isOverflow = thisAmt > unreleased;

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
            <h2 className="text-lg font-black text-gray-900">Issue Allotment Release Order (ARO)</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Authorize the release of funds for obligation based on the approved appropriation
            </p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-xl leading-none ml-4">×</button>
        </div>

        {/* Body */}
        <div className="px-7 py-5 space-y-4 overflow-y-auto">

          {/* ARO Number + Release Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                ARO Number
              </label>
              <input type="text" value={aroNumber} onChange={(e) => setAroNumber(e.target.value)}
                placeholder="e.g., 2025-01-001" className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Release Type
              </label>
              <select value={releaseType} onChange={(e) => setReleaseType(e.target.value)} className={inputCls}>
                <option value="" disabled>Select type</option>
                <option>Comprehensive (Full Year)</option>
                <option>Quarterly</option>
                <option>Specific Release</option>
              </select>
            </div>
          </div>

          {/* Fund Source */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Fund Source
            </label>
            <select value={fundSourceId} onChange={(e) => setFundSourceId(e.target.value)} className={inputCls}>
              {FUND_SOURCES_MOCK.map((fs) => (
                <option key={fs.id} value={fs.id}>{fs.label}</option>
              ))}
            </select>
          </div>

          {/* Target Expense Class */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Target Expense Class
            </label>
            <select value={expenseClass} onChange={(e) => setExpenseClass(e.target.value)} className={inputCls}>
              <option value="" disabled>Select expense class (filtered by appropriation)</option>
              {["PS", "MOOE", "FE", "CO"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Quarter (conditional) */}
          {releaseType === "Quarterly" && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Quarter</label>
              <select value={quarter} onChange={(e) => setQuarter(e.target.value)} className={inputCls}>
                <option value="" disabled>Select quarter</option>
                {["Q1", "Q2", "Q3", "Q4"].map((q) => <option key={q}>{q}</option>)}
              </select>
            </div>
          )}

          {/* Release date */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Release Date</label>
            <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className={inputCls} />
          </div>

          {/* For Later Release / This Release */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                For Later Release
              </label>
              <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50">
                ₱ {forLater.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-teal-600 mb-1.5">
                This Release
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₱</span>
                <input
                  type="number"
                  value={thisRelease}
                  onChange={(e) => setThisRelease(e.target.value)}
                  placeholder="0.00"
                  className={`${inputCls} pl-7 border-teal-500 ring-1 ring-teal-500`}
                />
              </div>
            </div>
          </div>

          {/* Unreleased balance */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Unreleased Appropriation (Selected Source)
            </p>
            <p className="ml-auto text-sm font-bold text-gray-800">
              {fmt(unreleased)}
            </p>
          </div>

          {isOverflow && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700">
              ⚠ Release amount exceeds the unreleased appropriation balance.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-7 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button
            disabled={isOverflow || !aroNumber || thisAmt <= 0}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#0f766e" }}
          >
            Submit Allotment
          </button>
        </div>
      </div>
    </div>
  );
}