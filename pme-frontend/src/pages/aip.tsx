import { useEffect, useMemo, useState } from "react";
import "@/styles/materialSymbols.css";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import {
  getAipFilterOptions,
  getAipList,
  type AipListItem,
} from "@/services/aip.service";

const PAGE_SIZE = 10;

function formatPHP(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function escapeCsv(value: unknown): string {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

export default function AipPage() {
  const [fiscalYear, setFiscalYear] = useState<number | null>(null);
  const [sectorId, setSectorId] = useState("all");
  const [officeId, setOfficeId] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const optionsQuery = useQuery({
    queryKey: ["aip", "filters"],
    queryFn: getAipFilterOptions,
  });

  const options = optionsQuery.data ?? null;

  useEffect(() => {
    if (!options || fiscalYear !== null) return;
    const latestYear =
      options.fiscalYears.length > 0
        ? options.fiscalYears[0]
        : new Date().getFullYear();
    setFiscalYear(latestYear);
  }, [options, fiscalYear]);

  useEffect(() => {
    setPage(1);
  }, [fiscalYear, sectorId, officeId, query]);

  const listQuery = useQuery({
    queryKey: ["aip", "list", fiscalYear, sectorId, officeId, query],
    queryFn: () =>
      getAipList({
        fiscalYear: fiscalYear ?? undefined,
        sectorId: sectorId === "all" ? undefined : sectorId,
        officeId: officeId === "all" ? undefined : officeId,
        q: query.trim() || undefined,
        page: 1,
        size: 500,
      }),
    enabled: fiscalYear !== null,
  });

  const payload = listQuery.data ?? null;
  const loadingOptions = optionsQuery.isLoading;
  const loadingList = listQuery.isLoading || listQuery.isFetching;
  const error =
    (optionsQuery.error instanceof Error && optionsQuery.error.message) ||
    (listQuery.error instanceof Error && listQuery.error.message) ||
    null;

  const sectors = options?.sectors ?? [];
  const offices = options?.offices ?? [];
  const years = options?.fiscalYears ?? [];

  const allItems = payload?.items ?? [];
  const pageCount = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleItems = allItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const summary = useMemo(() => {
    if (!payload) {
      return {
        count: 0,
        proposed: 0,
        appropriated: 0,
        allotted: 0,
        utilized: 0,
      };
    }

    return {
      count: payload.count,
      proposed: payload.totals.proposed,
      appropriated: payload.totals.appropriated,
      allotted: payload.totals.allotted,
      utilized: payload.totals.utilized,
    };
  }, [payload]);

  const handleExport = () => {
    if (!payload) return;

    const rows: string[][] = [
      [
        "#",
        "AIP Reference Code",
        "Project Title",
        "Implementing Office",
        "PS",
        "MOOE",
        "FE",
        "CO",
        "Total Proposed",
      ],
      ...visibleItems.map((it, index) => [
        String((currentPage - 1) * PAGE_SIZE + index + 1),
        it.aip_reference_code,
        it.project_title,
        it.implementing_office,
        String(it.propose_budget_ps),
        String(it.propose_budget_mooe),
        String(it.propose_budget_fe),
        String(it.propose_budget_co),
        String(it.total_proposed),
      ]),
    ];

    const yearSuffix = fiscalYear ?? payload.year;
    downloadCsv(`aip_fy_${yearSuffix}.csv`, rows);
  };

  const latestYear =
    years.length > 0 ? years[years.length - 1] : new Date().getFullYear();

  if ((loadingOptions || loadingList) && !payload) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="text-sm text-muted-foreground">Loading AIP...</div>
      </div>
    );
  }

  if (error && !payload) {
    return (
      <AppShell>
        <Topbar title="AIP Management" />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-destructive/30 bg-card p-6 text-center shadow-sm">
            <h1 className="text-lg font-black">AIP could not load</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => {
                void optionsQuery.refetch();
                void listQuery.refetch();
              }}
              className="mt-4 rounded bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
            >
              RETRY
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Topbar title="AIP Management" />

      <div className="flex flex-1 flex-col gap-4 overflow-auto p-5">
        <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
              Planning · FY {fiscalYear ?? latestYear}
            </span>
            <h1 className="text-2xl font-black tracking-tight">
              Annual Investment Program
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {summary.count} entries · proposed budget rolled up across PS, MOOE, FE and CO
            </p>
          </div>

          <div className="flex gap-2 self-start lg:self-auto">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              DOWNLOAD
            </button>
            <button
              onClick={() => {
                setSectorId("all");
                setOfficeId("all");
                setQuery("");
                setFiscalYear(latestYear);
              }}
              className="rounded bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90"
            >
              RESET FILTERS
            </button>
          </div>
        </header>

        {error ? (
          <div className="rounded border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-3 rounded-xl border border-border/50 bg-card p-3 shadow-sm xl:grid-cols-5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Fiscal Year
            </label>
            <select
              value={fiscalYear ?? ""}
              onChange={(e) => setFiscalYear(Number(e.target.value))}
              className="w-full rounded bg-muted px-3 py-1.5 text-xs font-medium outline-none focus:ring-1 focus:ring-primary"
            >
              {years.length === 0 ? (
                <option value={fiscalYear ?? ""}>FY {fiscalYear ?? latestYear}</option>
              ) : (
                years.map((y) => (
                  <option key={y} value={y}>
                    FY {y}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Sector Selection
            </label>
            <select
              value={sectorId}
              onChange={(e) => setSectorId(e.target.value)}
              className="w-full rounded bg-muted px-3 py-1.5 text-xs font-medium outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All</option>
              {sectors.map((s) => (
                <option key={s.sector_id} value={s.sector_id}>
                  {s.sector_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Implementing Office
            </label>
            <select
              value={officeId}
              onChange={(e) => setOfficeId(e.target.value)}
              className="w-full rounded bg-muted px-3 py-1.5 text-xs font-medium outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Offices</option>
              {offices.map((o) => (
                <option key={o.office_id} value={o.office_id}>
                  {o.office_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1 xl:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Search
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground">
                search
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by AIP code or Project Title..."
                className="w-full rounded bg-muted py-1.5 pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <span>
            Showing {visibleItems.length} of {summary.count} entries
          </span>
          {loadingList ? <span>Updating...</span> : <span>Ready</span>}
        </div>

        <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] table-fixed text-[11px]">
              <thead className="bg-muted/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="w-12 px-3 py-2.5 text-left">#</th>
                  <th className="w-40 px-3 py-2.5 text-left">AIP Reference Code</th>
                  <th className="w-64 px-3 py-2.5 text-left">Project Title</th>
                  <th className="w-52 px-3 py-2.5 text-left">Implementing Office</th>
                  <th className="w-28 px-3 py-2.5 text-right">PS</th>
                  <th className="w-28 px-3 py-2.5 text-right">MOOE</th>
                  <th className="w-28 px-3 py-2.5 text-right">FE</th>
                  <th className="w-28 px-3 py-2.5 text-right">CO</th>
                  <th className="w-32 px-3 py-2.5 text-right">Total Proposed</th>
                  <th className="w-20 px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {visibleItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No AIP entries match the current filters.
                    </td>
                  </tr>
                ) : (
                  visibleItems.map((it, index) => (
                    <AipRow
                      key={it.project_aip_id}
                      item={it}
                      index={(currentPage - 1) * PAGE_SIZE + index}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Showing {allItems.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, allItems.length)} of {allItems.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-border bg-card px-3 py-1.5 text-[10px] font-bold uppercase text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <span className="rounded bg-primary px-3 py-1.5 text-[10px] font-black text-primary-foreground">
              {currentPage} / {pageCount}
            </span>
            <button
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="rounded border border-border bg-card px-3 py-1.5 text-[10px] font-bold uppercase text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function AipRow({
  item,
  index,
}: {
  item: AipListItem;
  index: number;
}) {
  return (
    <tr className="border-t border-border/50 transition-colors hover:bg-muted/40">
      <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">
        {index + 1}
      </td>
      <td className="truncate px-3 py-2 font-mono text-[10px] text-muted-foreground">
        {item.aip_reference_code}
      </td>
      <td className="truncate px-3 py-2 font-bold text-foreground">
        {item.project_title}
      </td>
      <td className="truncate px-3 py-2 text-muted-foreground">
        {item.implementing_office}
      </td>
      <td className="px-3 py-2 text-right font-mono">
        {formatPHP(item.propose_budget_ps)}
      </td>
      <td className="px-3 py-2 text-right font-mono">
        {formatPHP(item.propose_budget_mooe)}
      </td>
      <td className="px-3 py-2 text-right font-mono">
        {formatPHP(item.propose_budget_fe)}
      </td>
      <td className="px-3 py-2 text-right font-mono">
        {formatPHP(item.propose_budget_co)}
      </td>
      <td className="px-3 py-2 text-right font-mono font-bold">
        {formatPHP(item.total_proposed)}
      </td>
      <td className="px-3 py-2 text-right">
        <Link
          to="/projects/$projectId"
          params={{ projectId: item.project_id }}
          search={{ year: item.aip_year } as never}
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-primary hover:underline"
        >
          View
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </td>
    </tr>
  );
}