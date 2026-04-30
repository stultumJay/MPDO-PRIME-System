import { AppIcon } from "@/components/ui/AppIcon";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: string;
  tone: "primary" | "ongoing" | "completed" | "delayed" | "utilization";
}

/* Left accent line */
const TONE_BORDER: Record<KpiCardProps["tone"], string> = {
  primary: "border-l-primary",
  ongoing: "border-l-status-ongoing",
  completed: "border-l-status-completed",
  delayed: "border-l-status-delayed",
  utilization: "border-l-status-utilization",
};

/* Icon tone (soft, not dominant) */
const TONE_ICON: Record<KpiCardProps["tone"], string> = {
  primary: "text-primary/40",
  ongoing: "text-status-ongoing/40",
  completed: "text-status-completed/40",
  delayed: "text-status-delayed/40",
  utilization: "text-status-utilization/40",
};

export function KpiCard({ label, value, icon, tone }: KpiCardProps) {
  const isDelayed = tone === "delayed";

  return (
    <div
      className={`
        bg-card
        border border-border
        rounded-lg
        px-5 py-4
        h-[96px]
        flex flex-col justify-between
        border-l-4
        shadow-[0_1px_2px_rgba(0,0,0,0.04)]
        ${TONE_BORDER[tone]}
      `}
    >
      {/* LABEL */}
      <p
        className={`
          text-[10px]
          font-semibold
          uppercase
          tracking-wider
          ${isDelayed ? "text-status-delayed" : "text-muted-foreground"}
        `}
      >
        {label}
      </p>

      {/* VALUE + ICON */}
      <div className="flex items-end justify-between">
        <span
          className={`
            text-2xl
            font-semibold
            leading-none
            ${isDelayed ? "text-status-delayed" : "text-foreground"}
          `}
        >
          {value}
        </span>

        <AppIcon
          name={icon}
          className={`h-5 w-5 ${TONE_ICON[tone]}`}
          strokeWidth={2}
        />
      </div>
    </div>
  );
}
