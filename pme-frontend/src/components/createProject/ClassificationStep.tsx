import type { WizardForm, WizardOptions } from "./types";
import "@/styles/materialSymbols.css";
import { SECTOR_META } from "./types";

interface Props {
  form: WizardForm;
  options: WizardOptions;
  onChange: <K extends keyof WizardForm>(key: K, value: WizardForm[K]) => void;
  onSelectSector: (sectorId: string) => void;
}

export function ClassificationStep({
  form,
  options,
  onChange,
  onSelectSector,
}: Props) {
  const filteredPrograms = options.programs.filter(
    (p) => p.sector_id === form.sector_id
  );

  return (
    <div className="h-full flex flex-col">

      <div>
        <h2 className="text-2xl font-black">Project Classification</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Classify the project into its functional domain.
        </p>
      </div>

      {/* SECTOR CARDS */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">

        {options.sectors.map((s) => {
          const meta = SECTOR_META[s.name] ?? {
            icon: "category",
            subtitle: "Sector",
          };

          const active = form.sector_id === s.id;

          return (
            <button
              key={s.id}
              onClick={() => onSelectSector(s.id)}
              className={`p-5 rounded-xl border text-left transition ${
                active
                  ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="mb-3">
                <span className="material-symbols-outlined text-primary">
                  {meta.icon}
                </span>
              </div>

              <div className="font-bold text-sm">{s.name}</div>
              <div className="text-xs text-muted-foreground">
                {meta.subtitle}
              </div>
            </button>
          );
        })}
      </div>

      {/* DROPDOWNS */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">

        <Field label="Implementing Office" required>
          <select
            className="input"
            value={form.office_id}
            onChange={(e) => onChange("office_id", e.target.value)}
          >
            <option value="">Select Office</option>
            {options.offices.map((o) => (
              <option key={o.id} value={o.id}>
                {o.code} · {o.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Program" required>
          <select
            className="input"
            value={form.program_id}
            onChange={(e) => onChange("program_id", e.target.value)}
          >
            {filteredPrograms.length === 0 && (
              <option value="">No programs available for this sector</option>
            )}
            {filteredPrograms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, required, children }: any) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold text-muted-foreground mb-1 block">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
