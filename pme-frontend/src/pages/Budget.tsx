import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import {
  formatCompactPHP,
  getBudgetData,
  type BudgetPayload,
} from "@/services/budget.service";

interface FinancialRecord {
  id: string;
  title: string;
  approved: number;
  released: number;
  utilized: number;
  sector: string;
  source: string;
}

interface StatCard {
  label: string;
  value: string;
  tone: "navy" | "primary" | "muted";
}

const fallbackFiscalYears = ["FY 2026"];
const fallbackSectors = ["All Sectors"];
const fallbackFundSources = ["All Sources"];

const PAGE_SIZE = 10;
const ALL_SECTORS = "All Sectors";
const ALL_SOURCES = "All Sources";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function parseFiscalYear(value?: string) {
  const match = value?.match(/\d{4}/);
  return match ? Number(match[0]) : undefined;
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getUtilizationPercent(record: FinancialRecord) {
  return record.approved ? (record.utilized / record.approved) * 100 : 0;
}

function getBalance(record: FinancialRecord) {
  return Math.max(record.released - record.utilized, 0);
}

function normalizeFilter(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function isAllSector(value: string) {
  return normalizeFilter(value) === normalizeFilter(ALL_SECTORS);
}

function isAllSource(value: string) {
  return normalizeFilter(value) === normalizeFilter(ALL_SOURCES);
}

function findOptionByNormalized(options: string[], value: string) {
  const key = normalizeFilter(value);
  return options.find((option) => normalizeFilter(option) === key);
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

function getStatTone(tone: StatCard["tone"]) {
  if (tone === "primary") return "border-l-4 border-l-primary text-primary";
  if (tone === "muted") return "text-muted-foreground";
  return "text-slate-950";
}

export default function Budget() {
  const initialLoadStartedRef = useRef(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [payload, setPayload] = useState<BudgetPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(fallbackFiscalYears[0]);
  const [selectedSector, setSelectedSector] = useState(fallbackSectors[0]);
  const [selectedSource, setSelectedSource] = useState(fallbackFundSources[0]);
  const [page, setPage] = useState(1);

  const loadBudgetData = useCallback(async (yearLabel?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBudgetData(parseFiscalYear(yearLabel));
      setPayload(data);
      const resolvedYear = `FY ${data.fiscalYear}`;
      setSelectedYear(resolvedYear);
      setSelectedSector((current) =>
        findOptionByNormalized(data.sectors, current) ?? ALL_SECTORS,
      );
      setSelectedSource((current) =>
        findOptionByNormalized(data.fundSources, current) ?? ALL_SOURCES,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load budget data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialLoadStartedRef.current) return;
    initialLoadStartedRef.current = true;
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getBudgetData();
        if (!mounted) return;
        setPayload(data);
        const resolvedYear = `FY ${data.fiscalYear}`;
        setSelectedYear(resolvedYear);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load budget data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const fiscalYears = payload?.fiscalYears ?? fallbackFiscalYears;
  const sectors = payload?.sectors ?? fallbackSectors;
  const fundSources = payload?.fundSources ?? fallbackFundSources;
  const financialRecords = payload?.records ?? [];
  const stats: StatCard[] = payload
    ? [
        { label: "Total Budget", value: formatCompactPHP(payload.stats.totalBudget), tone: "navy" },
        { label: "Total Spent", value: formatCompactPHP(payload.stats.totalSpent), tone: "primary" },
        { label: "Remaining Balance", value: formatCompactPHP(payload.stats.remainingBalance), tone: "muted" },
      ]
    : [];
  const allocation = payload?.allocation ?? [];
  const sectorOptions = useMemo(() => {
    if (!financialRecords.length) return sectors;
    const sourceFiltered = isAllSource(selectedSource)
      ? financialRecords
      : financialRecords.filter((record) => normalizeFilter(record.source) === normalizeFilter(selectedSource));
    return [ALL_SECTORS, ...uniqueSorted(sourceFiltered.map((record) => record.sector))];
  }, [financialRecords, sectors, selectedSource]);

  const fundSourceOptions = useMemo(() => {
    if (!financialRecords.length) return fundSources;
    const sectorFiltered = isAllSector(selectedSector)
      ? financialRecords
      : financialRecords.filter((record) => normalizeFilter(record.sector) === normalizeFilter(selectedSector));
    return [ALL_SOURCES, ...uniqueSorted(sectorFiltered.map((record) => record.source))];
  }, [financialRecords, fundSources, selectedSector]);

  useEffect(() => {
    const canonical = findOptionByNormalized(sectorOptions, selectedSector);
    if (!canonical) setSelectedSector(ALL_SECTORS);
    else if (canonical !== selectedSector) setSelectedSector(canonical);
  }, [sectorOptions, selectedSector]);

  useEffect(() => {
    const canonical = findOptionByNormalized(fundSourceOptions, selectedSource);
    if (!canonical) setSelectedSource(ALL_SOURCES);
    else if (canonical !== selectedSource) setSelectedSource(canonical);
  }, [fundSourceOptions, selectedSource]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = normalizeFilter(searchTerm);
    const selectedSectorKey = normalizeFilter(selectedSector);
    const selectedSourceKey = normalizeFilter(selectedSource);

    return financialRecords.filter((record) => {
      const matchesSearch =
        !normalizedSearch ||
        // Header search covers text fields and common numeric budget values.
        [record.id, record.title, record.sector, record.source, record.approved, record.released, record.utilized].some((value) =>
          normalizeFilter(value).includes(normalizedSearch),
        );
      const matchesSector =
        isAllSector(selectedSector) || normalizeFilter(record.sector) === selectedSectorKey;
      const matchesSource =
        isAllSource(selectedSource) || normalizeFilter(record.source) === selectedSourceKey;

      return matchesSearch && matchesSector && matchesSource;
    });
  }, [financialRecords, searchTerm, selectedSector, selectedSource]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedSector, selectedSource]);

  const exportBudgetCsv = () => {
    const year = parseFiscalYear(selectedYear) ?? payload?.fiscalYear ?? new Date().getFullYear();
    const rows: (string | number)[][] = [
      ["Project ID", "Project Title", "Sector", "Fund Source", "Approved", "Released", "Utilized", "Utilized %", "Balance"],
      ...filteredRecords.map((record) => [
        record.id,
        record.title,
        record.sector,
        record.source,
        record.approved,
        record.released,
        record.utilized,
        getUtilizationPercent(record).toFixed(1),
        getBalance(record),
      ]),
    ];

    downloadCsv(`budget_utilization_fy_${year}.csv`, rows);
  };

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  // Slice from the filtered source on every render so page navigation replaces rows instead of accumulating them.
  const visibleRecords = filteredRecords
    .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    .slice(0, PAGE_SIZE);

  return (
    <AppShell
      topbar={{
        title: "Budget Utilization",
        showSearch: true,
        searchValue: searchTerm,
        onSearchChange: setSearchTerm,
        searchPlaceholder: "Search project records...",
      }}
    >
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        <main className="min-h-0 flex-1 overflow-auto px-5 py-6 lg:px-8">
          <div className="mx-auto flex max-w-[1220px] flex-col gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
                Analytics & Reporting {payload ? `· FY ${payload.fiscalYear}` : ""}
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Budget Utilization Report
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-medium text-muted-foreground">
                Real-time expenditure tracking and fiscal performance for active programs.
              </p>
            </div>

            {error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground">
                Loading budget data...
              </div>
            ) : null}

            <section className="grid gap-3 rounded-xl border border-border bg-card p-3 shadow-sm lg:grid-cols-[180px_1fr_1fr_auto]">
              <FilterSelect
                label="Fiscal Year"
                value={selectedYear}
                options={fiscalYears}
                onChange={(value) => {
                  setSelectedYear(value);
                  setPage(1);
                  void loadBudgetData(value);
                }}
              />
              <FilterSelect
                label="Sector Selection"
                value={selectedSector}
                options={sectorOptions}
                onChange={setSelectedSector}
              />
              <FilterSelect
                label="Fund Source"
                value={selectedSource}
                options={fundSourceOptions}
                onChange={setSelectedSource}
              />
              <div className="flex items-end">
                <button
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
                  type="button"
                  disabled={loading}
                  onClick={() => void loadBudgetData(selectedYear)}
                >
                  <span className="material-symbols-outlined text-lg">filter_alt</span>
                  {loading ? "Loading" : "Apply"}
                </button>
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-12">
              <div className="grid gap-4 sm:grid-cols-3 xl:col-span-3 xl:grid-cols-1">
                {stats.map((stat) => (
                  <article
                    className={`rounded-xl border border-border bg-card p-4 shadow-sm ${stat.tone === "primary" ? "border-l-primary" : ""}`}
                    key={stat.label}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                    <p className={`mt-2 text-2xl font-black tabular-nums ${getStatTone(stat.tone)}`}>{stat.value}</p>
                  </article>
                ))}
              </div>

              <article className="rounded-xl border border-border bg-card p-5 shadow-sm xl:col-span-4">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Allocation by Sector</h2>
                <div className="mt-6 flex flex-col items-center justify-center gap-6 sm:flex-row">
                  <div className="relative h-36 w-36 rounded-full bg-[conic-gradient(#14b8a6_0_40%,#0f172a_40%_68%,#3b82f6_68%_82%,#f97316_82%_92%,#10b981_92%_100%)]">
                    <div className="absolute inset-5 flex items-center justify-center rounded-full bg-card">
                      <span className="text-sm font-black text-slate-950">
                        {allocation.length ? "100%" : "0%"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {allocation.map((item) => (
                      <div className="flex items-center gap-3" key={item.label}>
                        <span className={`h-3 w-3 rounded-full ${item.color}`} />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-tight text-slate-950">{item.label}</p>
                          <p className="text-[10px] font-bold text-slate-400">
                            {item.percent}% ({item.value})
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              <article className="rounded-xl border border-border bg-card p-5 shadow-sm xl:col-span-5">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Budget Performance Indicators
                </h2>
                <div className="mt-8 space-y-7">
                  <PerformanceBar
                    label="Current Year Utilization"
                    value={`${(payload?.stats.utilizationPercent ?? 0).toFixed(1)}%`}
                    percent={payload?.stats.utilizationPercent ?? 0}
                    tone="primary"
                  />
                  <PerformanceBar
                    label="Planned vs Actual Alignment"
                    value={`${(payload?.stats.alignmentPercent ?? 0).toFixed(1)}% Match`}
                    percent={payload?.stats.alignmentPercent ?? 0}
                    tone="navy"
                  />
                </div>
              </article>
            </div>

            <section className="min-h-[390px] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border bg-slate-50/40 px-5 py-4">
                <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-950">
                  Detailed Project Financial Analysis
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    disabled={!filteredRecords.length}
                    onClick={exportBudgetCsv}
                    aria-label="Download filtered budget records"
                    title="Download filtered budget records"
                  >
                    <span className="material-symbols-outlined text-xl">file_download</span>
                  </button>
                  <button
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-950"
                    type="button"
                    title="Clear table filters"
                    aria-label="Clear table filters"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedSector(ALL_SECTORS);
                      setSelectedSource(ALL_SOURCES);
                    }}
                  >
                    <span className="material-symbols-outlined text-xl">filter_list</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] table-fixed border-collapse text-left">
                  <thead className="border-b border-border bg-slate-50">
                    <tr>
                      <th className="w-32 px-5 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">Project ID</th>
                      <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">Project Title</th>
                      <th className="w-32 px-5 py-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-500">Approved</th>
                      <th className="w-32 px-5 py-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-500">Released</th>
                      <th className="w-32 px-5 py-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-500">Utilized</th>
                      <th className="w-24 px-5 py-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-500">Utilized %</th>
                      <th className="w-32 px-5 py-3 text-right text-[9px] font-black uppercase tracking-widest text-slate-500">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100" key={`${currentPage}-${searchTerm}-${selectedSector}-${selectedSource}`}>
                    {visibleRecords.map((record, index) => {
                      const utilization = getUtilizationPercent(record);

                      return (
                        <tr
                          className={`${index % 2 ? "bg-slate-50/50" : "bg-white"} transition hover:bg-primary/5`}
                          key={`${record.id}-${record.source}-${(currentPage - 1) * PAGE_SIZE + index}`}
                        >
                          <td className="px-5 py-3 font-mono text-[11px] font-bold text-primary">{record.id}</td>
                          <td className="truncate px-5 py-3 text-[11px] font-bold text-slate-950">{record.title}</td>
                          <td className="px-5 py-3 text-right text-[11px] font-medium tabular-nums text-slate-600">
                            {formatNumber(record.approved)}
                          </td>
                          <td className="px-5 py-3 text-right text-[11px] font-medium tabular-nums text-slate-600">
                            {formatNumber(record.released)}
                          </td>
                          <td className="px-5 py-3 text-right text-[11px] font-bold tabular-nums text-primary">
                            {formatNumber(record.utilized)}
                          </td>
                          <td className="px-5 py-3 text-right text-[11px] font-black tabular-nums text-slate-950">
                            {utilization.toFixed(1)}%
                          </td>
                          <td className="px-5 py-3 text-right text-[11px] font-bold tabular-nums text-slate-950">
                            {formatNumber(getBalance(record))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-border bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Showing{" "}
                  <span className="text-slate-950">
                    {filteredRecords.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-
                    {Math.min(currentPage * PAGE_SIZE, filteredRecords.length)}
                  </span>{" "}
                  of {filteredRecords.length} projects
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded border border-border bg-white px-3 py-1.5 text-[10px] font-black uppercase text-slate-700 transition hover:bg-slate-50 disabled:text-slate-400"
                    disabled={currentPage === 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    type="button"
                  >
                    Prev
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded bg-primary text-[10px] font-black text-white shadow-sm" type="button">
                    {currentPage}
                  </button>
                  <span className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    / {pageCount}
                  </span>
                  <button
                    className="rounded border border-border bg-white px-3 py-1.5 text-[10px] font-black uppercase text-slate-700 transition hover:bg-slate-50 disabled:text-slate-400"
                    disabled={currentPage >= pageCount}
                    onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                    type="button"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </section>
    </AppShell>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="ml-1 text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <select
        className="h-10 rounded-lg border border-border bg-slate-50 px-3 text-xs font-bold text-slate-950 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function PerformanceBar({
  label,
  value,
  percent,
  tone,
}: {
  label: string;
  value: string;
  percent: number;
  tone: "primary" | "navy";
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-4">
        <span className="text-[10px] font-black uppercase tracking-tight text-slate-950">{label}</span>
        <span className={`text-xs font-black ${tone === "primary" ? "text-primary" : "text-slate-950"}`}>{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone === "primary" ? "bg-primary" : "bg-slate-950"}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}