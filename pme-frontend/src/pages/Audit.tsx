import { useEffect, useMemo, useState } from "react";
import "@/styles/materialSymbols.css";
import { AppShell } from "../components/layout/AppShell";
import {
  getAuditEntries,
  type AuditAction,
  type AuditEntry,
} from "@/services/audit.service";

interface ActionMeta {
  icon: string;
  badge: string;
  iconBox: string;
  iconText: string;
}

const actions = ["All Actions", "Approval", "Update", "Create", "Delete", "Access"];
const PAGE_SIZE = 5;

const actionMeta: Record<AuditAction, ActionMeta> = {
  Approval: {
    icon: "verified",
    badge: "bg-teal-50 text-primary border-primary/20",
    iconBox: "bg-teal-50 border-teal-100",
    iconText: "text-primary",
  },
  Update: {
    icon: "edit_note",
    badge: "bg-blue-50 text-blue-700 border-blue-100",
    iconBox: "bg-blue-50 border-blue-100",
    iconText: "text-blue-600",
  },
  Create: {
    icon: "add_box",
    badge: "bg-green-50 text-green-700 border-green-100",
    iconBox: "bg-green-50 border-green-100",
    iconText: "text-green-600",
  },
  Delete: {
    icon: "delete_forever",
    badge: "bg-red-50 text-red-700 border-red-100",
    iconBox: "bg-red-50 border-red-100",
    iconText: "text-red-600",
  },
  Access: {
    icon: "security",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    iconBox: "bg-slate-100 border-slate-200",
    iconText: "text-slate-600",
  },
};

function csvCell(value: string | number) {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getCurrentMonthRange() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthNumber = String(month + 1).padStart(2, "0");
  const lastDay = new Date(year, month + 1, 0).getDate();

  return {
    startDate: `${year}-${monthNumber}-01`,
    endDate: `${year}-${monthNumber}-${String(lastDay).padStart(2, "0")}`,
  };
}

export default function Audit() {
  const defaultRange = useMemo(() => getCurrentMonthRange(), []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("All Modules");
  const [selectedAction, setSelectedAction] = useState(actions[0]);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeDateRangeInvalid = Boolean(startDate && endDate && startDate > endDate);

  useEffect(() => {
    if (activeDateRangeInvalid) return;
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const rows = await getAuditEntries({ startDate, endDate, limit: 250 });
        if (!mounted) return;
        setEntries(rows.length ? rows : []);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load audit trail.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [activeDateRangeInvalid, endDate, startDate]);

  const filteredEntries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesSearch =
        !normalizedSearch ||
        [entry.id, entry.user, entry.title, entry.module, entry.action].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );
      const matchesModule = selectedModule === "All Modules" || entry.module === selectedModule;
      const matchesAction = selectedAction === "All Actions" || entry.action === selectedAction;

      return matchesSearch && matchesModule && matchesAction;
    });
  }, [entries, searchTerm, selectedAction, selectedModule]);

  const moduleOptions = useMemo(
    () => ["All Modules", ...Array.from(new Set(entries.map((entry) => entry.module))).sort()],
    [entries],
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedAction, selectedModule, startDate, endDate]);

  const pageCount = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleEntries = filteredEntries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const displayError = activeDateRangeInvalid ? "Start date must be earlier than end date." : error;

  const dynamicMetrics = useMemo(() => {
    if (!entries.length) return [];

    const counts = entries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.module] = (acc[entry.module] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label, count], index) => ({
        label,
        percent: (count / entries.length) * 100,
        tone: index === 0 ? "bg-primary" : index === 1 ? "bg-primary/70" : "bg-slate-300",
      }));
  }, [entries]);

  const exportAuditLog = () => {
    downloadCsv(`audit-trail_${startDate}_${endDate}.csv`, [
      ["Record ID", "Action", "Title", "Module", "User", "Timestamp", "Detail"],
      ...filteredEntries.map((entry) => [
        entry.id,
        entry.action,
        entry.title,
        entry.module,
        entry.user,
        entry.timestamp,
        entry.detail,
      ]),
    ]);
  };

  return (
    <AppShell
      topbar={{
        title: "Audit Trail",
        showSearch: true,
        searchValue: searchTerm,
        onSearchChange: setSearchTerm,
        searchPlaceholder: "Search audit records...",
      }}
    >
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        <main className="min-h-0 flex-1 overflow-auto px-5 py-6 lg:px-8">
          <div className="mx-auto flex max-w-[1220px] flex-col gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-muted-foreground">System Governance</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Audit Trail</h1>
              <p className="mt-1 max-w-2xl text-sm font-medium text-muted-foreground">
                Full system accountability and activity monitoring log.
              </p>
            </div>

            {displayError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
                {displayError}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground">
                Loading audit trail...
              </div>
            ) : null}

            <div className="grid gap-5 xl:grid-cols-12">
              <div className="space-y-5 xl:col-span-9">
                <section className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm lg:grid-cols-[160px_160px_1fr_1fr]">
                  <AuditSelect value={selectedModule} options={moduleOptions} onChange={setSelectedModule} />
                  <AuditSelect value={selectedAction} options={actions} onChange={setSelectedAction} />

                  <label className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 text-xs font-black text-slate-950">
                    <span className="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400">Start</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="min-w-0 border-none bg-transparent p-0 text-xs font-black outline-none"
                    />
                  </label>
                  <label className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 text-xs font-black text-slate-950">
                    <span className="text-[9px] uppercase tracking-widest text-slate-400">End</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="min-w-0 border-none bg-transparent p-0 text-xs font-black outline-none"
                    />
                  </label>
                </section>

                <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                  <div className="divide-y divide-slate-100">
                    {visibleEntries.map((entry) => (
                      <AuditRow entry={entry} key={`${entry.id}-${entry.action}`} />
                    ))}
                    {!filteredEntries.length && (
                      <div className="flex h-56 items-center justify-center text-sm font-semibold text-muted-foreground">
                        No audit records match the current filters.
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Page {currentPage} of {pageCount} ({filteredEntries.length} entries)
                    </p>
                    <div className="flex gap-1">
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition hover:bg-white disabled:opacity-40"
                        type="button"
                        disabled={currentPage === 1}
                        aria-label="Previous audit page"
                        onClick={() => setPage((value) => Math.max(1, value - 1))}
                      >
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                      </button>
                      <button className="h-8 w-8 rounded-lg bg-primary text-xs font-black text-white shadow-sm" type="button">
                        {currentPage}
                      </button>
                      <span className="flex h-8 items-center px-2 text-xs font-black text-muted-foreground">
                        / {pageCount}
                      </span>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition hover:bg-white disabled:opacity-40"
                        type="button"
                        disabled={currentPage >= pageCount}
                        aria-label="Next audit page"
                        onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                      >
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              <aside className="space-y-5 xl:col-span-3">
                <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h2 className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                    <span className="material-symbols-outlined text-lg text-primary">analytics</span>
                    Activity Summary
                  </h2>
                  <div className="space-y-5">
                    {dynamicMetrics.map((metric) => (
                      <div className="space-y-2" key={metric.label}>
                        <div className="flex justify-between text-[11px] font-black uppercase text-slate-500">
                          <span>{metric.label}</span>
                          <span className="text-slate-950">{metric.percent.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${metric.tone}`} style={{ width: `${metric.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-8">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        Total Actions (24h)
                      </p>
                      <p className="text-3xl font-black tracking-tight text-slate-950">{entries.length}</p>
                    </div>
                    <span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-600">
                      +12%
                    </span>
                  </div>
                </section>

                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-lg">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Immutable Ledger</p>
                  <h3 className="mt-3 text-xl font-black tracking-tight">{entries.length} entries</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Audit records preserve accountability for approvals, financial changes, access updates, and automated system cleanup.
                  </p>
                  <button
                    className="mt-5 w-full rounded-lg bg-slate-800 py-2 text-[9px] font-black uppercase tracking-widest transition hover:bg-slate-700"
                    type="button"
                    onClick={exportAuditLog}
                  >
                    Export Audit Log
                  </button>
                </section>
              </aside>
            </div>
          </div>
        </main>
      </section>
    </AppShell>
  );
}

function AuditSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      className="h-10 rounded-lg border border-border bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const meta = actionMeta[entry.action];

  return (
    <article className="flex gap-5 p-5 transition hover:bg-slate-50/70">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${meta.iconBox}`}>
        <span className={`material-symbols-outlined filled text-xl ${meta.iconText}`}>{meta.icon}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <span className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase ${meta.badge}`}>
              {entry.action}
            </span>
            <h3 className="truncate text-sm font-black text-slate-950">{entry.title}</h3>
          </div>
          <span className="shrink-0 text-[10px] font-black uppercase tracking-tight text-muted-foreground">
            {entry.timestamp}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-muted-foreground">
          <span>
            Record ID: <span className="font-black text-slate-950">{entry.id}</span>
          </span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>
            Module: <span className="text-slate-950">{entry.module}</span>
          </span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>
            User: <span className="font-black text-slate-950">{entry.user}</span>
          </span>
        </div>

        <p className="mt-2 text-xs leading-5 text-muted-foreground">{entry.detail}</p>
      </div>
    </article>
  );
}