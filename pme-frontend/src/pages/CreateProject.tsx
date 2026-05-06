import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";

import { DetailsStep } from "@/components/createProject/DetailsStep";
import { ClassificationStep } from "@/components/createProject/ClassificationStep";
import { ReviewStep } from "@/components/createProject/ReviewStep";

import type { WizardForm, WizardOptions } from "@/components/createProject/types";

import {
  createProject,
  getCreateProjectOptions,
  type CreateProjectOptions,
} from "@/services/createProject.service";

const STEPS = [
  { key: "details", label: "Details" },
  { key: "classification", label: "Classification" },
  { key: "review", label: "Review" },
] as const;

function makeInitialForm(): WizardForm {
  return {
    project_title: "",
    project_description: "",
    barangay: "",
    street: "",
    sector_id: "",
    office_id: "",
    program_id: "",
    latitude: undefined,
    longitude: undefined,
  };
}

function pickFirstProgram(options: CreateProjectOptions, sectorId: string) {
  return (
    options.programs.find((p) => p.sector_id === sectorId)?.id ??
    options.programs[0]?.id ??
    ""
  );
}

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<WizardForm>(() => makeInitialForm());

  const optionsQuery = useQuery({
    queryKey: ["create-project", "options"],
    queryFn: getCreateProjectOptions,
  });
  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (created) => {
      if (created.project_id) {
        void navigate({
          to: "/projects/$projectId",
          params: { projectId: created.project_id },
        });
      } else {
        void navigate({ to: "/projects" });
      }
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to create project.");
    },
  });
  const options = optionsQuery.data ?? null;
  const submitting = createProjectMutation.isPending;

  useEffect(() => {
    const res = optionsQuery.data;
    if (!res) return;

    setForm((current) => {
      const firstSector = res.sectors[0]?.id ?? "";
      const firstOffice = res.offices[0]?.id ?? "";
      const firstProgram = pickFirstProgram(res, firstSector);

      return {
        ...current,
        sector_id: current.sector_id || firstSector,
        office_id: current.office_id || firstOffice,
        program_id: current.program_id || firstProgram,
      };
    });
  }, [optionsQuery.data]);

  const onChange = <K extends keyof WizardForm>(key: K, value: WizardForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const onSelectSector = (sectorId: string) => {
    if (!options) return;

    const firstProgram = pickFirstProgram(options, sectorId);

    setForm((current) => ({
      ...current,
      sector_id: sectorId,
      program_id: firstProgram,
    }));
  };

  const next = () => {
    setError(null);

    if (stepIdx === 0) {
      if (!form.project_title.trim()) {
        setError("Project title is required.");
        return;
      }
    }

    if (stepIdx === 1) {
      if (!form.sector_id) {
        setError("Please select a sector.");
        return;
      }
      if (!form.office_id) {
        setError("Please select an implementing office.");
        return;
      }
      if (!form.program_id) {
        setError("Please select a program.");
        return;
      }
    }

    setStepIdx((current) => Math.min(STEPS.length - 1, current + 1));
  };

  const back = () => {
    setError(null);
    setStepIdx((current) => Math.max(0, current - 1));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!form.project_title.trim()) {
      setError("Project title is required.");
      setStepIdx(0);
      return;
    }

    if (!form.sector_id || !form.office_id || !form.program_id) {
      setError("Please complete the classification fields before submitting.");
      setStepIdx(1);
      return;
    }

    const hasLatitude = typeof form.latitude === "number" && Number.isFinite(form.latitude);
    const hasLongitude = typeof form.longitude === "number" && Number.isFinite(form.longitude);
    if (!hasLatitude || !hasLongitude) {
      setError("Please select a project location on the map before submitting.");
      setStepIdx(0);
      return;
    }
    createProjectMutation.mutate({
      project_title: form.project_title.trim(),
      project_description: form.project_description.trim() || undefined,
      program_id: form.program_id,
      sector_id: form.sector_id,
      office_id: form.office_id,
      barangay: form.barangay.trim() || undefined,
      street: form.street.trim() || undefined,
      location_lat: typeof form.latitude === "number" ? form.latitude : undefined,
      location_lng: typeof form.longitude === "number" ? form.longitude : undefined,
      locational_clearance_status: false,
    });
  };

  const uiOptions: WizardOptions | null = useMemo(() => {
    if (!options) return null;

    return {
      sectors: options.sectors,
      offices: options.offices,
      programs: options.programs.map((program) => ({
        ...program,
        office_id: form.office_id || program.office_id || "",
      })),
    };
  }, [options, form.office_id]);

  if (!optionsQuery.isLoading && (optionsQuery.error || error) && (!options || !uiOptions)) {
    return (
      <AppShell>
        <Topbar title="Create Project" />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-destructive/30 bg-card p-6 text-center shadow-sm">
            <h1 className="text-lg font-black">Create Project could not load</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {optionsQuery.error instanceof Error ? optionsQuery.error.message : error}
            </p>
            <button
              onClick={() => void optionsQuery.refetch()}
              className="mt-4 rounded bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
            >
              RETRY
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (optionsQuery.isLoading || !options || !uiOptions) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const activeStep = STEPS[stepIdx];

  return (
    <AppShell>
      <Topbar title="Create Project" />

      <div className="flex h-full min-h-0 flex-col px-4 py-4 sm:px-6 lg:px-10">
        <div className="shrink-0 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight">Create New Project</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Complete the wizard, review the summary, then submit.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <span>Step</span>
              <span className="text-foreground">
                {stepIdx + 1} / {STEPS.length}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {STEPS.map((step, index) => {
              const active = index === stepIdx;
              const done = index < stepIdx;

              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setStepIdx(index)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : done
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : done
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </span>
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="shrink-0 mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <section className="min-h-0 flex-1 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="h-full min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {stepIdx === 0 && <DetailsStep form={form} onChange={onChange} />}

            {stepIdx === 1 && (
              <ClassificationStep
                form={form}
                options={uiOptions}
                onChange={onChange}
                onSelectSector={onSelectSector}
              />
            )}

            {stepIdx === 2 && <ReviewStep form={form} options={uiOptions} />}
          </div>
        </section>

        <footer className="shrink-0 mt-4 flex items-center justify-between gap-3 border-t bg-background/95 pt-4 pb-2">
          <button
            type="button"
            onClick={back}
            disabled={stepIdx === 0 || submitting}
            className="rounded-xl border px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-xs text-muted-foreground">
              {activeStep.label}
            </span>

            {stepIdx < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Confirm & Create"}
              </button>
            )}
          </div>
        </footer>
      </div>
    </AppShell>
  );
}
