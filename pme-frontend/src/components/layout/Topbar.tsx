import { AppIcon } from "@/components/ui/AppIcon";

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-8 shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-bold uppercase tracking-tight">{title}</h2>
        <div className="h-4 w-px bg-border" />
        <div className="relative">
          <AppIcon
            name="search"
            className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            className="pl-8 pr-4 py-1 bg-muted border-none rounded text-[11px] focus:ring-1 focus:ring-primary w-48 outline-none"
            placeholder="Search data..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-1.5 text-muted-foreground hover:bg-muted rounded transition-colors">
          <AppIcon name="notifications" className="h-5 w-5" />
        </button>
        <button className="p-1.5 text-muted-foreground hover:bg-muted rounded transition-colors">
          <AppIcon name="help" className="h-5 w-5" />
        </button>
        <div className="h-7 w-7 rounded-full bg-primary/20 border border-border ml-1 flex items-center justify-center text-[10px] font-bold text-primary">
          MPDO
        </div>
      </div>
    </header>
  );
}
