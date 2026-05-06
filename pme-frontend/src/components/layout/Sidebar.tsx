import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useSidebar } from "./SidebarContext";
import { getStoredAccessToken, logout } from "@/services/tokenService";
import { AppIcon } from "@/components/ui/AppIcon";
import { getMyProfile } from "@/services/user.service";

interface NavItem {
  label: string;
  icon: string;
  to: string;
  exact?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}
interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: "Dashboard",
    items: [{ label: "Overview", icon: "dashboard", to: "/overview", exact: true }],
  },
  {
    title: "Planning",
    items: [{ label: "AIP", icon: "calendar_today", to: "/aip" }],
  },
  {
    title: "Project Management",
    items: [
      { label: "Program", icon: "view_list", to: "/program" },
      { label: "Project List", icon: "search", to: "/projects", exact: true },
      { label: "Create Project", icon: "add_circle", to: "/projects/create" },
    ],
  },
  {
    title: "Analytics & Reporting",
    items: [
      { label: "Monthly Monitoring", icon: "assessment", to: "/monitoring" },
      { label: "Budget Utilization", icon: "payments", to: "/budget" },
      { label: "Gantt Chart", icon: "timeline", to: "/gantt" },
      { label: "Map-Base Monitoring", icon: "map", to: "/map" },
      { label: "Issue & Risk Log", icon: "report", to: "/issues" },
      { label: "Audit Log", icon: "history", to: "/audit" },
    ],
  },
  {
    title: "System Management",
    items: [
      { label: "Account Management", icon: "manage_accounts", to: "/accounts" },
      { label: "System Settings", icon: "settings", to: "/settings" },
    ],
  },
];

const FOOTER: NavItem[] = [
  { label: "My Profile", icon: "person", to: "/profile" },
  { label: "Logout", icon: "logout", to: "/", onClick: logout },
];

export function Sidebar() {
  const { collapsed, toggle } = useSidebar();
  const widthClass = collapsed ? "w-16" : "w-64";
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const accessToken = getStoredAccessToken();
  const profileQuery = useQuery({
    queryKey: ["auth", "me", accessToken],
    queryFn: getMyProfile,
    staleTime: 300_000,
    enabled: Boolean(accessToken),
  });
  const isAdmin = profileQuery.data?.role_name === "ADMIN";
  const visibleSections = SECTIONS.map((section) =>
    section.title === "System Management" && !isAdmin
      ? { ...section, items: section.items.map((item) => ({ ...item, disabled: true })) }
      : section,
  );
  const activeItem =
    [...SECTIONS.flatMap((section) => section.items), ...FOOTER].find((item) =>
      item.exact ? pathname === item.to : pathname.startsWith(item.to),
    ) ?? SECTIONS[0].items[0];

  return (
    <aside
      className={`sticky top-0 z-50 flex h-screen ${widthClass} shrink-0 flex-col overflow-hidden border-r border-[#1d2336] bg-[#11182c] text-white transition-[width] duration-300 ease-in-out`}
    >
      <div
        className={`flex items-center ${
          collapsed ? "justify-center px-3 py-4" : "justify-between px-5 pb-4 pt-4"
        }`}
      >
        <div className={`flex items-start gap-3 ${collapsed ? "hidden" : ""}`}>
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] bg-[#18c9b8] text-[#0f1a2f]">
            <AppIcon name={activeItem.icon} className="h-[18px] w-[18px]" />
          </div>
          <div>
            <h1 className="text-[15px] font-extrabold leading-none tracking-tight">
              MPDO Portal
            </h1>
            <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-[#b6c3da]">
              PRIME System
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#d7e0ef] transition hover:bg-[#1b2a45] hover:text-[#ffffff]"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <AppIcon
            name={collapsed ? "chevron_right" : "chevron_left"}
            className="h-5 w-5"
          />
        </button>
      </div>

      <nav className={`flex-1 overflow-x-hidden px-3 pb-2 pt-0 ${collapsed ? "space-y-3" : ""}`}>
        {visibleSections.map((section) => (
          <div key={section.title} className="mb-4 last:mb-0">
            {collapsed ? (
              <div className="mx-2 mb-2 h-px bg-[#1d2336]" />
            ) : (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9fb3d1]">
                {section.title}
              </p>
            )}

            {section.items.map((item) => (
              <NavRow
                key={item.to}
                item={item}
                collapsed={collapsed}
                isActive={item.exact ? pathname === item.to : pathname.startsWith(item.to)}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto space-y-1 border-t border-[#1d2336] px-3 pb-3 pt-2">
        {FOOTER.map((item) => (
          <NavRow
            key={item.label}
            item={item}
            collapsed={collapsed}
            isActive={item.exact ? pathname === item.to : pathname.startsWith(item.to)}
          />
        ))}
      </div>
    </aside>
  );
}

function NavRow({
  item,
  collapsed,
  isActive,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
}) {
  const rowClass = `
    mb-0.5 flex items-center rounded-md py-1.5 text-[14px] transition
    ${collapsed ? "justify-center px-0" : "gap-3 px-3"}
    ${
      item.disabled
        ? "cursor-not-allowed text-[#6f7d95] opacity-60 hover:bg-transparent hover:text-[#6f7d95]"
        : isActive
        ? "border-r-2 border-[#27d2c2] bg-[#103844] text-[#9ff7ec] shadow-[inset_0_0_0_1px_rgba(39,210,194,0.08)]"
        : "text-[#e4ecf7] hover:bg-[#1b2a45] hover:text-[#ffffff]"
    }
  `;

  if (item.disabled) {
    return (
      <button
        type="button"
        aria-disabled="true"
        onClick={(event) => event.preventDefault()}
        title={collapsed ? item.label : `${item.label} requires administrator access`}
        className={`w-full ${rowClass}`}
      >
        <AppIcon name={item.icon} className="h-[19px] w-[19px]" />
        {!collapsed && <span className="truncate font-medium">{item.label}</span>}
      </button>
    );
  }

  return (
    <Link
      to={item.to}
      onClick={() => item.onClick?.()}
      title={collapsed ? item.label : undefined}
      className={rowClass}
    >
      <AppIcon name={item.icon} className="h-[19px] w-[19px]" />

      {!collapsed && <span className="truncate font-medium">{item.label}</span>}
    </Link>
  );
}