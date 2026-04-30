import { useEffect, useMemo, useState } from "react";
import "@/styles/materialSymbols.css";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";

import {
  createProgram,
  getProgramsGrouped,
  type ProgramListPayload,
  type SectorCard,
} from "@/services/program.service";

const SECTOR_ICONS: Record<string, string> = {
  Infrastructure: "engineering",
  Social: "diversity_3",
  Environmental: "park",
  Economic: "storefront",
  Institutional: "account_balance",
  Others: "category",
};

export default function ProgramPage() {
  const [data, setData] = useState<ProgramListPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSector, setOpenSector] = useState<SectorCard | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState({
    program_name: "",
    sector_id: "",
    description: "",
  });

  const sectors = useMemo(() => data?.sectors ?? [], [data]);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await getProgramsGrouped();
      setData(res);
      setOpenSector((current) => {
        if (!current) return current;
        return res.sectors.find((s) => s.sector_id === current.sector_id) ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load programs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreateModal() {
    setForm({
      program_name: "",
      sector_id: "",
      description: "",
    });
    setCreateError(null);
    setShowCreate(true);
  }

  async function handleCreate() {
    setCreateError(null);

    if (!form.program_name.trim()) {
      setCreateError("Program name is required.");
      return;
    }

    if (!form.sector_id) {
      setCreateError("Sector is required.");
      return;
    }

    try {
      setSaving(true);
      await createProgram({
        program_name: form.program_name.trim(),
        sector_id: form.sector_id,
        description: form.description.trim() || undefined,
      });

      setShowCreate(false);
      setForm({ program_name: "", sector_id: "", description: "" });
      await load();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create program");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <Topbar title="Program List" />
        <div className="flex flex-1 items-center justify-center p-10">
          Loading programs...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Topbar title="Program List" />

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
              Project Management
            </span>
            <h1 className="text-2xl font-black tracking-tight">Programs by Sector</h1>
            <p className="text-sm text-muted-foreground">
              Programs are grouped by sector and loaded from the database.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90"
          >
            + Create Program
          </button>
        </header>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sectors.map((s) => (
            <article
              key={s.sector_id}
              className="flex flex-col gap-4 rounded-lg border bg-card p-5 shadow-sm"
            >
              <header className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-primary">
                    {SECTOR_ICONS[s.sector_name] ?? "category"}
                  </span>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Sector {s.sector_code ?? "-"}
                    </p>
                    <h3 className="font-bold">{s.sector_name}</h3>
                  </div>
                </div>

                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  {s.program_count}
                </span>
              </header>

              <p className="text-xs text-muted-foreground">
                {s.program_count === 0
                  ? "No programs yet for this sector."
                  : `${s.program_count} program(s) linked to this sector.`}
              </p>

              <button
                onClick={() => setOpenSector(s)}
                className="mt-auto rounded-md bg-primary py-2 text-xs font-bold text-white hover:opacity-90"
              >
                View Programs
              </button>
            </article>
          ))}
        </div>

        {sectors.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
            No sectors found.
          </div>
        ) : null}
      </div>

      <SectorPanel sector={openSector} onClose={() => setOpenSector(null)} />

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">Create Program</h2>

            <div className="space-y-3">
              {createError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {createError}
                </div>
              ) : null}

              <input
                placeholder="Program Name"
                className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                value={form.program_name}
                onChange={(e) =>
                  setForm({ ...form, program_name: e.target.value })
                }
              />

              <select
                className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                value={form.sector_id}
                onChange={(e) => setForm({ ...form, sector_id: e.target.value })}
              >
                <option value="">Select Sector</option>
                {sectors.map((s) => (
                  <option key={s.sector_id} value={s.sector_id}>
                    {s.sector_name}
                  </option>
                ))}
              </select>

              <textarea
                placeholder="Description"
                className="min-h-28 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setCreateError(null);
                  setShowCreate(false);
                }}
                className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function SectorPanel({
  sector,
  onClose,
}: {
  sector: SectorCard | null;
  onClose: () => void;
}) {
  if (!sector) return null;

  return (
    <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Sector Detail
          </p>
          <h2 className="text-lg font-black">{sector.sector_name}</h2>
          <p className="text-xs text-muted-foreground">
            Sector {sector.sector_code ?? "-"} / {sector.program_count} program(s)
          </p>
        </div>

        <button
          onClick={onClose}
          className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-muted"
        >
          Close
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {sector.programs.length === 0 ? (
          <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
            No programs available for this sector.
          </div>
        ) : (
          sector.programs.map((p) => (
            <div key={p.program_id} className="rounded-lg border p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Code {p.program_code}
              </p>
              <p className="mt-1 font-bold">{p.program_name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {p.description ?? "-"}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
