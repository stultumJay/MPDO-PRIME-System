import { AppShell } from "./AppShell";
import { Topbar } from "./Topbar";

interface FeaturePlaceholderProps {
  title: string;
  eyebrow: string;
  heading: string;
  description: string;
}

export function FeaturePlaceholder({
  title,
  eyebrow,
  heading,
  description,
}: FeaturePlaceholderProps) {
  return (
    <AppShell>
      <Topbar title={title} />
      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-10 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground">
            {heading}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
