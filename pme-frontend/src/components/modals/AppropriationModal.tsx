import { useEffect, useMemo, useState } from "react";
import "@/styles/materialSymbols.css";
import {
  createAppropriation,
  createAppropriationFundSource,
  type AppropriationFundSourceOption,
  type CurrentAppropriationInfo,
  type FundSourceOption,
} from "@/services/projectActions.service";
import { formatPHPFull } from "@/lib/format";
import {
  ModalShell,
  FieldLabel,
  inputCls,
  readonlyInputCls,
  ModalButton,
} from "./ModalShell";

const EXPENSE_CLASSES = ["CO", "PS", "MOOE", "FE"] as const;

interface Row {
  fund_source_id: string;
  expense_class: string;
  amount: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  projectAipId?: string;
  projectCode: string;
  projectTitle: string;
  aipReference?: string;
  year: number;
  fundSources: FundSourceOption[];
  existingLines?: AppropriationFundSourceOption[];
  appropriation?: CurrentAppropriationInfo;
}

export default function AppropriationModal({
  open,
  onClose,
  onSaved,
  projectAipId,
  projectCode,
  projectTitle,
  aipReference,
  year,
  fundSources,
  existingLines = [],
  appropriation,
}: Props) {
  const firstAvailableRow = (): Row => {
    const existingKeys = new Set(
      existingLines.map((line) => `${line.fund_source_id}:${line.expense_class}`),
    );

    for (const fundSource of fundSources) {
      for (const expenseClass of EXPENSE_CLASSES) {
        const key = `${fundSource.fund_source_id}:${expenseClass}`;
        if (!existingKeys.has(key)) {
          return {
            fund_source_id: fundSource.fund_source_id,
            expense_class: expenseClass,
            amount: "",
          };
        }
      }
    }

    return {
      fund_source_id: fundSources[0]?.fund_source_id ?? "",
      expense_class: "CO",
      amount: "",
    };
  };

  const [aoNumber, setAoNumber] = useState(
    appropriation?.ao_number ?? "",
  );
  const [rows, setRows] = useState<Row[]>([firstAvailableRow()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAoNumber(appropriation?.ao_number ?? "");
    setRows([firstAvailableRow()]);
    setError(null);
  }, [open, appropriation?.ao_number, fundSources, existingLines]);

  const total = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.amount) || 0), 0),
    [rows],
  );

  const updateRow = (idx: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const addRow = () =>
    setRows((rs) => [...rs, firstAvailableRow()]);

  const removeRow = (idx: number) =>
    setRows((rs) => rs.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setBusy(true);
    setError(null);
    try {
      if (!projectAipId) {
        throw new Error("This project is not linked to an AIP record yet.");
      }

      const targetAppropriationId =
        appropriation?.appropriation_id ||
        (
          await createAppropriation({
            project_aip_id: projectAipId,
            ao_number: aoNumber,
            fiscal_year: String(year),
          })
        ).appropriation_id;

      const validRows = rows.filter((r) => Number(r.amount) > 0 && !isExistingLine(r));

      await Promise.all(
        validRows.map((r) =>
          createAppropriationFundSource({
            appropriation_id: targetAppropriationId,
            fund_source_id: r.fund_source_id,
            expense_class: r.expense_class,
            appropriated_amount: Number(r.amount),
          }),
        ),
      );
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save appropriation");
    } finally {
      setBusy(false);
    }
  };

  const hasCompletePositiveRow = rows.some(
    (row) => row.fund_source_id && row.expense_class && Number(row.amount) > 0,
  );
  const hasIncompletePositiveRow = rows.some(
    (row) => Number(row.amount) > 0 && (!row.fund_source_id || !row.expense_class),
  );
  const isExistingLine = (row: Row) =>
    existingLines.some(
      (line) =>
        line.fund_source_id === row.fund_source_id &&
        line.expense_class === row.expense_class,
    );
  const positiveRows = rows.filter((row) => Number(row.amount) > 0);
  const hasExistingDuplicate = positiveRows.some(isExistingLine);
  const hasDraftDuplicate =
    new Set(positiveRows.map((row) => `${row.fund_source_id}:${row.expense_class}`)).size !==
    positiveRows.length;
  const isValid =
    Boolean(projectAipId) &&
    fundSources.length > 0 &&
    total > 0 &&
    hasCompletePositiveRow &&
    !hasIncompletePositiveRow &&
    !hasExistingDuplicate &&
    !hasDraftDuplicate &&
    aoNumber.trim().length > 0;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Define Project Appropriation"
      subtitle="Establish the legal authority and ceiling from the Appropriation Ordinance (AO)"
      size="max-w-3xl"
      footer={
        <>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
              Total Authorized Ceiling
            </span>
            <span className="text-2xl font-bold text-primary">
              {formatPHPFull(total)}
            </span>
          </div>
          <div className="flex gap-3">
            <ModalButton variant="secondary" onClick={onClose} disabled={busy}>
              Cancel
            </ModalButton>
            <ModalButton
              onClick={handleSave}
              disabled={busy || !isValid}
            >
              {busy ? "Saving..." : "Save Appropriation"}
            </ModalButton>
          </div>
        </>
      }
    >
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">
          {error}
        </div>
      )}

      {fundSources.length === 0 && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
          No fund sources are configured. Contact the system administrator to add fund sources first.
        </div>
      )}

      {hasExistingDuplicate && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
          One selected fund source and expense class already exists under this appropriation.
          Choose another combination or continue with allotment for the existing line.
        </div>
      )}

      {hasDraftDuplicate && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
          Duplicate fund source and expense class combinations cannot be saved in the same appropriation.
        </div>
      )}

      {/* Project context fields */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-7">
        <div>
          <FieldLabel>Project ID</FieldLabel>
          <input className={readonlyInputCls} readOnly value={projectCode} />
        </div>
        <div>
          <FieldLabel required>AO Number</FieldLabel>
          <input
            className={inputCls}
            placeholder="e.g., AO-2025-01"
            value={aoNumber}
            onChange={(e) => setAoNumber(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Project Title</FieldLabel>
          <input className={readonlyInputCls} readOnly value={projectTitle} />
        </div>
        <div>
          <FieldLabel>AIP Reference Code</FieldLabel>
          <input
            className={`${readonlyInputCls} font-mono text-xs`}
            readOnly
            value={aipReference ?? "—"}
          />
        </div>
      </div>

      {/* Breakdown table */}
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
        Appropriation Breakdown Table
      </h3>
      <div className="border border-border rounded-2xl overflow-hidden bg-muted/20">
        <table className="w-full text-left">
          <thead className="bg-card border-b border-border">
            <tr>
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Fund Source
              </th>
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
                Expense Class
              </th>
              <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">
                Amount (₱)
              </th>
              <th className="px-5 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="bg-card">
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t border-border first:border-t-0">
                <td className="px-5 py-3">
                  <select
                    className={inputCls}
                    value={r.fund_source_id}
                    onChange={(e) =>
                      updateRow(idx, { fund_source_id: e.target.value })
                    }
                  >
                    {fundSources.map((f) => (
                      <option key={f.fund_source_id} value={f.fund_source_id}>
                        {f.fund_name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-3">
                  <select
                    className={inputCls}
                    value={r.expense_class}
                    onChange={(e) =>
                      updateRow(idx, { expense_class: e.target.value })
                    }
                  >
                    {EXPENSE_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-3">
                  <input
                    className={`${inputCls} text-right`}
                    type="number"
                    min={0}
                    placeholder="0.00"
                    value={r.amount}
                    onChange={(e) => updateRow(idx, { amount: e.target.value })}
                  />
                </td>
                <td className="px-3 py-3">
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove row"
                    >
                      <span className="material-symbols-outlined text-base">
                        remove_circle
                      </span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        disabled={fundSources.length === 0}
        className="flex items-center gap-2 text-primary font-bold text-xs hover:text-primary/80 transition-colors py-3 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-lg">add_circle</span>
        Add Another Source / Class
      </button>
    </ModalShell>
  );
}