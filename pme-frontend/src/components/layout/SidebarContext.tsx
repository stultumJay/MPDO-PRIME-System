import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface SidebarCtx {
  collapsed: boolean;
  toggle: () => void;
}

/**
 * Module-level fallback store so the sidebar still works even if a route tree
 * accidentally renders <Sidebar /> outside a <SidebarProvider> (e.g. during
 * SSR module-instance duplication caused by route code-splitting). The
 * collapsed state is shared via a tiny pub/sub instead of throwing.
 */
let fallbackCollapsed = false;
const fallbackListeners = new Set<() => void>();
const fallbackToggle = () => {
  fallbackCollapsed = !fallbackCollapsed;
  fallbackListeners.forEach((l) => l());
};

const Ctx = createContext<SidebarCtx | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(fallbackCollapsed);
  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      fallbackCollapsed = next;
      fallbackListeners.forEach((l) => l());
      return next;
    });
  };
  return <Ctx.Provider value={{ collapsed, toggle }}>{children}</Ctx.Provider>;
}

export function useSidebar(): SidebarCtx {
  const ctx = useContext(Ctx);
  const [, force] = useState(0);
  useEffect(() => {
    if (ctx) return;
    const listener = () => force((n) => n + 1);
    fallbackListeners.add(listener);
    return () => {
      fallbackListeners.delete(listener);
    };
  }, [ctx]);
  if (ctx) return ctx;
  return { collapsed: fallbackCollapsed, toggle: fallbackToggle };
}
