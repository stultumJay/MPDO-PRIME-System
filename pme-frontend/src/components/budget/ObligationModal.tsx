import { useState } from "react";
import { fmt } from "../../pages/ProjectDetail";

interface ObligationModalProps {
  isOpen: boolean;
  onClose: () => void;
  unobligatedBalance?: number;
}

const ALLOTMENTS_MOCK = [
  { id: "ARO-2025-001", label: "ARO-2025-001 — National Government Fund CO — ₱1,260,000" },
  { id: "ARO-2025-002", label: "ARO-2025-002 — LGU Development Fund CO — ₱840,000" },
];

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 " +
  "placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white";

export default function ObligationModal({
  isOpen,
  onClose,
  unobligatedBalance = 8_270_000,
}: ObligationModalProps) {
  const [allotmentId, setAllotmentId]   = useState("");
  const [payee, setPayee]               = useState("");
  const [amount, setAmount]             = useState("");
  const [referenceDoc, setReferenceDoc] = useState("");
  const [obligationDate, setObligationDate] = useState("");
  const [remarks, setRemarks]           = useState("");

  if (!isOpen) return null;

  const thisAmt = parseFloat(amount) || 0;
  const remaining = unobligatedBalance - thisAmt;
  const isOverflow = thisAmt > unobligatedBalance;
  const canSave = payee.trim() && thisAmt > 0 && referenceDoc.trim() && !isOverflow;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,15,30,0.65)", backdropFilter: "blur(3px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-gray-900">Record Obligation Request (ObR)</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Commit funds for signed contracts or purchase orders.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-xl leading-none ml-4">×</button>
        </div>

        {/* Body */}
        <div className="px-7 py-5 space-y-4 overflow-y-auto">

          {/* Allotment selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Link to Allotment (ARO)
            </label>
            <select value={allotmentId} onChange={(e) => setAllotmentId(e.target.value)} className={inputCls}>
              <option value="" disabled>Select Allotment Release Order…</option>
              {ALLOTMENTS_MOCK.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </div>

          {/* Payee / Contractor */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Payee / Contractor
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔍</span>
              <input
                type="text"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                placeholder="Search registered contractor..."
                className={`${inputCls} pl-8`}
              />
            </div>
          </div>

          {/* Obligation Amount + Reference Document */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Obligation Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₱</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`${inputCls} pl-7`}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Reference Document
              </label>
              <input
                type="text"
                value={referenceDoc}
                onChange={(e) => setReferenceDoc(e.target.value)}
                placeholder="PO No. or Contract No."
                className={inputCls}
              />
            </div>
          </div>

          {/* Obligation Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Obligation Date <span className="text-red-400">*</span>
            </label>
            <input type="date" value={obligationDate} onChange={(e) => setObligationDate(e.target.value)} className={inputCls} />
            <p className="text-[9px] text-gray-400 mt-1">
              Enter the actual date the obligation was incurred, which may differ from today.
            </p>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Remarks (optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              placeholder="Nature of obligation, scope of work…"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Info notice */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg border border-blue-200 bg-blue-50">
            <span className="text-blue-500 text-base mt-0.5">ℹ</span>
            <p className="text-[10px] text-blue-800 leading-relaxed">
              Ensure all supporting documents (Contract, BAC Resolution, NTP) are attached to the physical ObR form before submission to the Budget Office.
            </p>
          </div>

          {/* Unobligated Balance + overflow warning */}
          {isOverflow && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700">
              ⚠ Obligation amount exceeds the unobligated allotment balance.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-7 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Unobligated Balance</p>
            <p className="text-sm font-bold text-gray-800">{fmt(unobligatedBalance)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <button
              disabled={!canSave}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "#0f766e" }}
            >
              Record Obligation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}