import { LocationMap } from "./LocationMap";
import type { WizardForm } from "./types";
import { BARANGAYS } from "./types";

interface Props {
  form: WizardForm;
  onChange: <K extends keyof WizardForm>(key: K, value: WizardForm[K]) => void;
}

export function DetailsStep({ form, onChange }: Props) {
  const geoQuery = [form.street, form.barangay, "Alubijid, Misamis Oriental, Philippines"]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="grid grid-cols-12 gap-6 h-full">

      {/* LEFT PANEL */}
      <div className="col-span-12 lg:col-span-5 flex flex-col">

        <h2 className="text-2xl font-black">New Project Initiation</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Define the identity and geographic parameters.
        </p>

        <div className="mt-6 space-y-4">

          {/* TITLE */}
          <Field label="Project Title" required>
            <input
              className="input"
              placeholder="e.g. Flood Control Phase II"
              value={form.project_title}
              onChange={(e) => onChange("project_title", e.target.value)}
            />
          </Field>

          {/* DESCRIPTION */}
          <Field label="Project Description">
            <textarea
              className="input"
              rows={4}
              placeholder="Describe scope and intended impact..."
              value={form.project_description}
              onChange={(e) => onChange("project_description", e.target.value)}
            />
          </Field>

          {/* LOCATION */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Barangay">
              <select
                className="input"
                value={form.barangay}
                onChange={(e) => onChange("barangay", e.target.value)}
              >
                <option value="">Select</option>
                {BARANGAYS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>

            <Field label="Street">
              <input
                className="input"
                placeholder="Street / Building"
                value={form.street}
                onChange={(e) => onChange("street", e.target.value)}
              />
            </Field>
          </div>

          {/* STATUS HINT */}
          <div className="text-xs text-muted-foreground">
            Coordinates will be automatically captured from the map.
          </div>
        </div>
      </div>

      {/* MAP PANEL */}
      <div className="col-span-12 lg:col-span-7 h-[420px] lg:h-full rounded-xl overflow-hidden border">
        <LocationMap
          position={
            form.latitude && form.longitude
              ? { lat: form.latitude, lng: form.longitude }
              : undefined
          }
          onPositionChange={(p) => {
            onChange("latitude", p.lat);
            onChange("longitude", p.lng);
          }}
          searchQuery={geoQuery}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
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
