import { useEffect } from "react";
import "@/styles/materialSymbols.css";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "max-w-xl" | "max-w-2xl" | "max-w-3xl" | "max-w-4xl";
}

export function ModalShell({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "max-w-2xl",
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`bg-card w-full ${size} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 pt-7 pb-5 relative">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="text-xl font-black tracking-tight text-foreground">
                {title}
              </h2>
              {subtitle && (
                <p className="text-muted-foreground text-sm mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
              aria-label="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <div className="px-8 pb-6 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-8 py-5 bg-muted/40 border-t border-border flex items-center justify-between gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Field building blocks shared by every modal                        */
/* ------------------------------------------------------------------ */
export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
      {children} {required && <span className="text-destructive">*</span>}
    </label>
  );
}

export const inputCls =
  "w-full px-4 py-3 rounded-xl bg-muted/40 border border-border focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm text-foreground placeholder:text-muted-foreground/60";

export const readonlyInputCls =
  "w-full px-4 py-3 rounded-xl bg-muted/60 border border-border text-sm text-muted-foreground font-medium cursor-not-allowed";

export function ModalButton({
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
}) {
  const cls =
    variant === "primary"
      ? "px-7 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:bg-primary/40 disabled:cursor-not-allowed"
      : "px-6 py-2.5 rounded-xl border border-border text-foreground font-bold text-sm hover:bg-muted transition-colors";
  return <button {...props} className={`${cls} ${props.className ?? ""}`} />;
}