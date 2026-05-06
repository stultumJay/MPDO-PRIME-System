import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { SidebarProvider } from "./SidebarContext";
import { Topbar, type TopbarProps } from "./Topbar";

export function AppShell({
  children,
  topbar,
}: {
  children: ReactNode;
  topbar?: TopbarProps;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          {topbar ? <Topbar {...topbar} /> : null}
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
