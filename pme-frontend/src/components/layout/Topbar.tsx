import { AppIcon } from "@/components/ui/AppIcon";

export interface TopbarProps {
  title: string;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  onSearchSubmit?: (value: string) => void;
}

export function Topbar({
  title,
  showSearch = false,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search data...",
  onSearchSubmit,
}: TopbarProps) {
  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-8 shrink-0">
      <div className="flex items-center gap-4">
        <p className="text-sm font-bold uppercase tracking-tight">{title}</p>
        {showSearch ? (
          <>
            <div className="h-4 w-px bg-border" />
            <form
              className="relative"
              onSubmit={(event) => {
                event.preventDefault();
                onSearchSubmit?.(searchValue);
              }}
            >
              <AppIcon
                name="search"
                className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                className="w-56 rounded bg-muted py-1 pl-8 pr-4 text-[11px] outline-none focus:ring-1 focus:ring-primary"
                placeholder={searchPlaceholder}
                type="search"
                aria-label={searchPlaceholder}
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
              />
            </form>
          </>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="p-1.5 text-muted-foreground hover:bg-muted rounded transition-colors"
          aria-label="View notifications"
          title="View notifications"
        >
          <AppIcon name="notifications" className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="p-1.5 text-muted-foreground hover:bg-muted rounded transition-colors"
          aria-label="Open help"
          title="Open help"
        >
          <AppIcon name="help" className="h-5 w-5" />
        </button>
        <div className="h-7 w-7 rounded-full bg-primary/40 border border-border ml-1 flex items-center justify-center text-[10px] font-bold text-primary">
          MPDO
        </div>
      </div>
    </header>
  );
}
