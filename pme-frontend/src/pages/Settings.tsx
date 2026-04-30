import { type FormEvent, useEffect, useMemo, useState } from "react";
import "@/styles/materialSymbols.css";
import { AppShell } from "../components/layout/AppShell";
import {
  createPhase,
  createSector,
  deletePhase,
  deleteSector,
  getPhaseWeightSummary,
  listOffices,
  listPhases,
  listPrograms,
  listSectors,
  updatePhase,
  updateSector,
  type OfficeConfig,
  type PhaseConfig,
  type PhaseWeightSummary,
  type ProgramConfig,
  type SectorConfig,
} from "@/services/settings.service";

export default function Settings() {
  const [sectors, setSectors] = useState<SectorConfig[]>([]);
  const [phases, setPhases] = useState<PhaseConfig[]>([]);
  const [programs, setPrograms] = useState<ProgramConfig[]>([]);
  const [offices, setOffices] = useState<OfficeConfig[]>([]);
  const [summary, setSummary] = useState<PhaseWeightSummary | null>(null);
  const [sectorForm, setSectorForm] = useState({ sector_code: "", sector_name: "" });
  const [phaseForm, setPhaseForm] = useState({ phase_name: "", weight_percent: "" });
  const [editingSectorId, setEditingSectorId] = useState<string | null>(null);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [pendingSectorDelete, setPendingSectorDelete] = useState<SectorConfig | null>(null);
  const [pendingPhaseDelete, setPendingPhaseDelete] = useState<PhaseConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const phaseTotal = useMemo(
    () => summary?.total_weight ?? phases.reduce((total, phase) => total + phase.weight_percent, 0),
    [phases, summary],
  );

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);
      const [sectorRows, phaseRows, weightSummary, programRows, officeRows] = await Promise.all([
        listSectors(),
        listPhases(),
        getPhaseWeightSummary(),
        listPrograms(),
        listOffices(),
      ]);
      setSectors(sectorRows);
      setPhases(phaseRows);
      setSummary(weightSummary);
      setPrograms(programRows);
      setOffices(officeRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  const submitSector = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      if (editingSectorId) {
        await updateSector(editingSectorId, sectorForm);
        setMessage("Sector updated.");
      } else {
        await createSector(sectorForm);
        setMessage("Sector created.");
      }
      setSectorForm({ sector_code: "", sector_name: "" });
      setEditingSectorId(null);
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save sector.");
    } finally {
      setSaving(false);
    }
  };

  const submitPhase = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const payload = {
        phase_name: phaseForm.phase_name,
        weight_percent: Number(phaseForm.weight_percent),
      };
      if (editingPhaseId) {
        await updatePhase(editingPhaseId, payload);
        setMessage("Phase updated.");
      } else {
        await createPhase(payload);
        setMessage("Phase created.");
      }
      setPhaseForm({ phase_name: "", weight_percent: "" });
      setEditingPhaseId(null);
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save phase.");
    } finally {
      setSaving(false);
    }
  };

  const startSectorEdit = (sector: SectorConfig) => {
    setEditingSectorId(sector.sector_id);
    setSectorForm({
      sector_code: sector.sector_code,
      sector_name: sector.sector_name,
    });
  };

  const startPhaseEdit = (phase: PhaseConfig) => {
    setEditingPhaseId(phase.phase_id);
    setPhaseForm({
      phase_name: phase.phase_name,
      weight_percent: String(phase.weight_percent),
    });
  };

  const removeSector = async (sector: SectorConfig) => {
    try {
      setSaving(true);
      setError(null);
      await deleteSector(sector.sector_id);
      setMessage("Sector deleted.");
      setPendingSectorDelete(null);
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete sector.");
    } finally {
      setSaving(false);
    }
  };

  const removePhase = async (phase: PhaseConfig) => {
    try {
      setSaving(true);
      setError(null);
      await deletePhase(phase.phase_id);
      setMessage("Phase deleted.");
      setPendingPhaseDelete(null);
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete phase.");
    } finally {
      setSaving(false);
    }
  };

  const activePrograms = useMemo(
    () => programs.filter((program) => program.is_active).length,
    [programs],
  );
  const mandatoryOffices = useMemo(
    () => offices.filter((office) => office.office_type === 1).length,
    [offices],
  );
  const optionalOffices = useMemo(
    () => offices.filter((office) => office.office_type === 2).length,
    [offices],
  );

  return (
    <AppShell>
      <section className="flex min-h-0 flex-1 flex-col overflow-auto bg-background px-5 py-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1220px] flex-col gap-6">
          <header className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">
              System Management
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              System Settings
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-medium text-muted-foreground">
              Maintain project sectors and phase weights used by monitoring, timeline, and reporting modules.
            </p>
          </header>

          {error ? (
            <StateCard
              tone="error"
              title="Settings could not load"
              message={error}
              actionLabel="Retry"
              onAction={() => void loadSettings()}
            />
          ) : null}

          {message ? (
            <StateCard tone="success" title="Settings updated" message={message} />
          ) : null}

          {loading ? (
            <LoadingSummaryCards labels={["Sectors", "Programs", "Offices", "Phase Weight"]} />
          ) : null}

          {!loading ? (
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SystemSummaryCard
                label="Configured Sectors"
                value={sectors.length}
                detail="Project and AIP classification groups"
                icon="category"
              />
              <SystemSummaryCard
                label="Active Programs"
                value={activePrograms}
                detail={`${programs.length} total programs under sectors`}
                icon="account_tree"
              />
              <SystemSummaryCard
                label="Implementing Offices"
                value={offices.length}
                detail={`${mandatoryOffices} mandatory / ${optionalOffices} optional`}
                icon="business"
              />
              <SystemSummaryCard
                label="Phase Weight"
                value={`${phaseTotal.toFixed(0)}%`}
                detail={`${summary?.active_phases ?? phases.length} active phases`}
                icon={summary?.is_balanced ? "check_circle" : "error"}
                tone={summary?.is_balanced ? "success" : "warning"}
              />
            </section>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
            <section className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-lg font-black text-slate-950">Sector Configuration</h2>
                <p className="text-sm font-medium text-muted-foreground">
                  Sectors classify programs, projects, maps, and reporting groups.
                </p>
              </div>

              <form
                onSubmit={submitSector}
                className="grid gap-3 border-b border-border bg-slate-50/60 px-5 py-4 md:grid-cols-[140px_1fr_auto]"
              >
                <ConfigField
                  label="Code"
                  value={sectorForm.sector_code}
                  onChange={(value) => setSectorForm((current) => ({ ...current, sector_code: value }))}
                />
                <ConfigField
                  label="Sector Name"
                  value={sectorForm.sector_name}
                  onChange={(value) => setSectorForm((current) => ({ ...current, sector_name: value }))}
                />
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-11 rounded-xl bg-primary px-4 text-xs font-black uppercase tracking-widest text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                  >
                    {editingSectorId ? "Update" : "Add"}
                  </button>
                  {editingSectorId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSectorId(null);
                        setSectorForm({ sector_code: "", sector_name: "" });
                      }}
                      className="h-11 rounded-xl border border-border bg-white px-4 text-xs font-black uppercase tracking-widest text-muted-foreground transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>

              <div className="divide-y divide-border">
                {sectors.map((sector) => (
                  <div
                    key={sector.sector_id}
                    className="grid gap-3 px-5 py-4 md:grid-cols-[110px_1fr_auto]"
                  >
                    <span className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-primary">
                      {sector.sector_code}
                    </span>
                    <div>
                      <p className="font-black text-slate-950">{sector.sector_name}</p>
                      <p className="text-xs font-medium text-muted-foreground">
                        Used by project, AIP, monitoring, and reports.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <IconButton icon="edit" label="Edit" onClick={() => startSectorEdit(sector)} />
                      <IconButton
                        icon="delete"
                        label="Delete"
                        danger
                        onClick={() => setPendingSectorDelete(sector)}
                      />
                    </div>
                  </div>
                ))}
                {!sectors.length ? (
                  <EmptyState
                    icon="category"
                    title="No sectors configured"
                    message="Sectors are required for project classification, programs, AIP coding, maps, and reports."
                  />
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">Phase Weights</h2>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total phase weight should equal 100%.
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                      summary?.is_balanced
                        ? "bg-primary/10 text-primary"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {phaseTotal.toFixed(0)}%
                  </span>
                </div>
              </div>

              <form onSubmit={submitPhase} className="space-y-3 border-b border-border bg-slate-50/60 px-5 py-4">
                <ConfigField
                  label="Phase Name"
                  value={phaseForm.phase_name}
                  onChange={(value) => setPhaseForm((current) => ({ ...current, phase_name: value }))}
                />
                <ConfigField
                  label="Weight Percent"
                  value={phaseForm.weight_percent}
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  onChange={(value) => setPhaseForm((current) => ({ ...current, weight_percent: value }))}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-11 rounded-xl bg-primary px-4 text-xs font-black uppercase tracking-widest text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                  >
                    {editingPhaseId ? "Update Phase" : "Add Phase"}
                  </button>
                  {editingPhaseId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPhaseId(null);
                        setPhaseForm({ phase_name: "", weight_percent: "" });
                      }}
                      className="h-11 rounded-xl border border-border bg-white px-4 text-xs font-black uppercase tracking-widest text-muted-foreground transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>

              <div className="divide-y divide-border">
                {phases.map((phase) => (
                  <div key={phase.phase_id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-950">{phase.phase_name}</p>
                        <p className="text-xs font-medium text-muted-foreground">
                          {phase.weight_percent.toFixed(2)}% monitoring weight
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <IconButton icon="edit" label="Edit" onClick={() => startPhaseEdit(phase)} />
                        <IconButton
                          icon="delete"
                          label="Delete"
                          danger
                          onClick={() => setPendingPhaseDelete(phase)}
                        />
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, phase.weight_percent)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {!phases.length ? (
                  <EmptyState
                    icon="timeline"
                    title="No phases configured"
                    message="Phase weights are required before weighted project progress can be summarized."
                  />
                ) : null}
              </div>
            </section>
          </div>
        </div>

        {pendingSectorDelete ? (
          <ConfirmPanel
            title="Delete Sector"
            message={`Delete ${pendingSectorDelete.sector_name}? This can fail if projects or programs still reference it.`}
            saving={saving}
            onCancel={() => setPendingSectorDelete(null)}
            onConfirm={() => void removeSector(pendingSectorDelete)}
          />
        ) : null}

        {pendingPhaseDelete ? (
          <ConfirmPanel
            title="Delete Phase"
            message={`Delete ${pendingPhaseDelete.phase_name}? This can fail if progress records still reference it.`}
            saving={saving}
            onCancel={() => setPendingPhaseDelete(null)}
            onConfirm={() => void removePhase(pendingPhaseDelete)}
          />
        ) : null}
      </section>
    </AppShell>
  );
}

function ConfigField({
  label,
  value,
  type = "text",
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        type={type}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
        required
      />
    </label>
  );
}

function SystemSummaryCard({
  label,
  value,
  detail,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "bg-primary/10 text-primary"
      : tone === "warning"
        ? "bg-orange-100 text-orange-700"
        : "bg-slate-100 text-slate-700";

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <span className={`material-symbols-outlined rounded-lg p-1.5 text-lg ${toneClass}`}>
          {icon}
        </span>
      </div>
      <p className="text-2xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">{detail}</p>
    </article>
  );
}

function LoadingSummaryCards({ labels }: { labels: string[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {labels.map((label) => (
        <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 h-3 w-24 rounded bg-slate-100" />
          <div className="h-7 w-16 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function StateCard({
  tone,
  title,
  message,
  actionLabel,
  onAction,
}: {
  tone: "error" | "success";
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const toneClass =
    tone === "error"
      ? "border-destructive/30 bg-destructive/5 text-destructive"
      : "border-primary/30 bg-primary/10 text-primary";

  return (
    <div className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${toneClass}`}>
      <div>
        <p className="text-sm font-black text-slate-950">{title}</p>
        <p className="mt-0.5 text-sm font-semibold">{message}</p>
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="self-start rounded-lg border border-current/20 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition hover:bg-slate-50 sm:self-auto"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  message,
}: {
  icon: string;
  title: string;
  message: string;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <span className="material-symbols-outlined rounded-xl bg-slate-100 p-2 text-2xl text-muted-foreground">
        {icon}
      </span>
      <p className="mt-3 text-sm font-black text-slate-950">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm font-medium text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

function IconButton({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: string;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
        danger
          ? "border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
          : "border-border bg-white text-muted-foreground hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </button>
  );
}

function ConfirmPanel({
  title,
  message,
  saving,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={(event) => event.target === event.currentTarget && onCancel()}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-950">{title}</h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl border border-border bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {saving ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}