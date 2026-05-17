import type { WizardForm, WizardOptions } from "./types";

interface Props {
  form: WizardForm;
  options: WizardOptions;
}

export function ReviewStep({ form, options }: Props) {
  const sector = options.sectors.find((s) => s.id === form.sector_id);
  const office = options.offices.find((o) => o.id === form.office_id);
  const program = options.programs.find((p) => p.id === form.program_id);

  return (
    <div className="h-full flex flex-col">

      {/* HEADER */}
      <div>
        <span className="text-xs font-bold text-primary uppercase">
          Final Step
        </span>

        <h2 className="text-3xl font-black mt-1">
          Review Project Proposal
        </h2>

        <p className="text-sm text-muted-foreground mt-1">
          Ensure all information is correct before submission.
        </p>
      </div>

      {/* CONTENT */}
      <div className="mt-6 grid grid-cols-12 gap-6">

        {/* LEFT SUMMARY */}
        <div className="col-span-12 lg:col-span-8">
          <div className="border rounded-2xl p-6 bg-card shadow-sm">

            <Section title="Project Identity">

              <Item label="Project Title" large>
                {form.project_title || "—"}
              </Item>

              <Item label="Description">
                {form.project_description || "—"}
              </Item>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <Item label="Barangay">{form.barangay || "—"}</Item>
                <Item label="Street">{form.street || "—"}</Item>
              </div>
            </Section>

            <Section title="Classification">
              <div className="grid grid-cols-2 gap-4">
                <Item label="Sector">{sector?.name ?? "—"}</Item>
                <Item label="Office">{office?.name ?? "—"}</Item>
                <Item label="Program">{program?.name ?? "—"}</Item>
              </div>
            </Section>

            <Section title="Location">
              <Item label="Coordinates">
                {form.latitude && form.longitude
                  ? `${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)}`
                  : "Not set"}
              </Item>
            </Section>

          </div>
        </div>

        {/* RIGHT SIDE (SUMMARY META) */}
        <div className="col-span-12 lg:col-span-4">
          <div className="border rounded-2xl p-6 bg-card h-full flex flex-col justify-between">

            <div>
              <h3 className="font-bold text-sm">Submission Summary</h3>

              <div className="mt-4 space-y-3 text-sm">
                <Meta label="Sector">{sector?.name ?? "-"}</Meta>
                <Meta label="Program">{program?.name ?? "-"}</Meta>
                <Meta label="Office">{office?.name ?? "-"}</Meta>
              </div>
            </div>

            <div className="mt-6 text-xs text-muted-foreground">
              Once submitted, this project will be registered and assigned a code automatically.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* UI helpers */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-bold mb-3">{title}</h4>
      {children}
    </div>
  );
}

function Item({
  label,
  children,
  large,
}: {
  label: string;
  children: React.ReactNode;
  large?: boolean;
}) {
  return (
    <div className="mb-3">
      <div className="text-[10px] text-muted-foreground uppercase font-bold">
        {label}
      </div>
      <div className={large ? "text-xl font-black" : "text-sm font-semibold"}>
        {children}
      </div>
    </div>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{children}</span>
    </div>
  );
}