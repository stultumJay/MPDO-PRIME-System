import { useState } from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface FundRow {
  id: number;
  fundType: string;
  expenseClass: string;
  amount: string;
}

interface AppropriationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const FUND_TYPES = [
  "General Fund Proper",
  "LGU Development Fund (20%)",
  "Local Disaster Risk Reduction Management Fund (LDRRMF)",
  "Special Education Fund (SEF)",
  "National Government Fund",
  "Grant / Aid / Donation",
  "Loan Proceeds",
  "Other",
];

const EXPENSE_CLASSES = ["PS", "MOOE", "FE", "CO"];

const OFFICES = [
  "Municipal Engineer's Office",
  "Municipal Health Office",
  "Municipal Planning & Development Office",
  "Municipal Social Welfare & Development Office",
  "Municipal Agriculture Office",
  "Municipal Administrator's Office",
];

// ─── SHARED INPUT STYLE ──────────────────────────────────────────────────────
const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 " +
  "placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent " +
  "transition-all bg-white";

const SelectInput = ({
  value,
  onChange,
  placeholder,
  children,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`${inputCls} ${className}`}
  >
    {placeholder && (
      <option value="" disabled>
        {placeholder}
      </option>
    )}
    {children}
  </select>
);

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function AppropriationModal({
  isOpen,
  onClose,
}: AppropriationModalProps) {
  const [aipCode, setAipCode] = useState("");
  const [office, setOffice] = useState("Municipal Engineer's Office");
  const [aoNumber, setAoNumber] = useState("");
  const [fiscalYear, setFiscalYear] = useState("2025");
  const [isContinuing, setIsContinuing] = useState(false);
  const [rows, setRows] = useState<FundRow[]>([
    { id: 1, fundType: "General Fund Proper", expenseClass: "CO", amount: "" },
    { id: 2, fundType: "",                    expenseClass: "",   amount: "" },
  ]);

  if (!isOpen) return null;

  // Computed totals
  const totalCeiling = rows.reduce(
    (sum, r) => sum + (parseFloat(r.amount) || 0),
    0
  );

  const updateRow = (id: number, key: keyof FundRow, value: string) =>
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      { id: Date.now(), fundType: "", expenseClass: "", amount: "" },
    ]);

  const removeRow = (id: number) =>
    setRows((prev) => prev.filter((r) => r.id !== id));

  const canSave = aipCode.trim() && totalCeiling > 0;

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,15,30,0.65)", backdropFilter: "blur(3px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Modal */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">
              Define Project Appropriation
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Establish the legal authority and ceiling from the Appropriation Ordinance (AO)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-500 transition-colors text-xl leading-none ml-4"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-5 overflow-y-auto space-y-5">

          {/* Row 1: AIP Reference Code + Implementing Office */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                AIP Reference Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={aipCode}
                  onChange={(e) => setAipCode(e.target.value)}
                  placeholder="Search code (e.g., 1000-3-01...)"
                  className={inputCls}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">
                  🔍
                </span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Implementing Office
              </label>
              <SelectInput value={office} onChange={setOffice}>
                {OFFICES.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </SelectInput>
            </div>
          </div>

          {/* Row 2: AO Number + Fiscal Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                AO Number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={aoNumber}
                onChange={(e) => setAoNumber(e.target.value)}
                placeholder="e.g., AO-2025-01"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                Fiscal Year <span className="text-red-400">*</span>
              </label>
              <SelectInput value={fiscalYear} onChange={setFiscalYear}>
                {["2023", "2024", "2025", "2026"].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </SelectInput>
            </div>
          </div>

          {/* Breakdown Table */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              Appropriation Breakdown Table
            </p>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["Fund Source", "Expense Class", "Amount (₱)", ""].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-gray-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((row, idx) => {
                    const isEmpty = !row.fundType;
                    return (
                      <tr key={row.id} className={isEmpty ? "opacity-50" : ""}>
                        {/* Fund Source */}
                        <td className="px-3 py-2">
                          <SelectInput
                            value={row.fundType}
                            onChange={(v) => updateRow(row.id, "fundType", v)}
                            placeholder="Select Fund Source..."
                            className="text-sm"
                          >
                            {FUND_TYPES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </SelectInput>
                        </td>
                        {/* Expense Class */}
                        <td className="px-3 py-2 w-36">
                          <SelectInput
                            value={row.expenseClass}
                            onChange={(v) => updateRow(row.id, "expenseClass", v)}
                            placeholder="Expense Class..."
                            className="text-sm"
                          >
                            {EXPENSE_CLASSES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </SelectInput>
                        </td>
                        {/* Amount */}
                        <td className="px-3 py-2 w-40">
                          <input
                            type="number"
                            value={row.amount}
                            onChange={(e) => updateRow(row.id, "amount", e.target.value)}
                            placeholder="0.00"
                            className={`${inputCls} text-right`}
                          />
                        </td>
                        {/* Delete */}
                        <td className="px-3 py-2 w-10 text-center">
                          {idx > 0 && !isEmpty && (
                            <button
                              onClick={() => removeRow(row.id)}
                              className="text-gray-300 hover:text-red-400 transition-colors text-base leading-none"
                            >
                              🗑
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Add row */}
              <div className="px-4 py-2.5 border-t border-gray-100">
                <button
                  onClick={addRow}
                  className="flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors"
                >
                  <span className="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-sm leading-none">+</span>
                  + Add Another Source/Class
                </button>
              </div>
            </div>
          </div>

          {/* Continuing appropriation checkbox */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50">
            <input
              type="checkbox"
              id="continuing"
              checked={isContinuing}
              onChange={(e) => setIsContinuing(e.target.checked)}
              className="mt-0.5 rounded accent-teal-600"
            />
            <label htmlFor="continuing" className="text-xs text-amber-800 cursor-pointer leading-relaxed">
              <span className="font-bold">Continuing Appropriation</span> — For Capital Outlay (CO) items that remain valid beyond the fiscal year until fully spent or completed. (LGC §322)
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-7 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
              Total Authorized Ceiling
            </p>
            <p className="text-xl font-black" style={{ color: "#0f766e" }}>
              {fmt(totalCeiling)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={!canSave}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all
                ${canSave ? "hover:opacity-90 active:scale-[0.98]" : "opacity-40 cursor-not-allowed"}`}
              style={{ background: "#0f766e" }}
            >
              Save Appropriation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}