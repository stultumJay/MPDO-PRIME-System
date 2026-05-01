import { Suspense, lazy } from "react";
import {
  Navigate,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getMyProfile } from "@/services/user.service";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const Overview = lazy(() => import("./pages/Overview"));
const AIP = lazy(() => import("./pages/aip"));
const Program = lazy(() => import("./pages/Program"));
const Project = lazy(() => import("./pages/Project"));
const ProjectDetail = lazy(() => import("./pages/projects.$projectId"));
const CreateProject = lazy(() => import("./pages/CreateProject"));
const Monitoring = lazy(() => import("./pages/Monitoring"));
const Budget = lazy(() => import("./pages/Budget"));
const Gannt = lazy(() => import("./pages/Gannt"));
const Map = lazy(() => import("./pages/Map"));
const Issues = lazy(() => import("./pages/Issues"));
const Audit = lazy(() => import("./pages/Audit"));
const Settings = lazy(() => import("./pages/Settings"));
const Accounts = lazy(() => import("./pages/Accounts"));
const Profile = lazy(() => import("./pages/Profile"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 120_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

function RoutePending() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading page...</p>
      </div>
    </div>
  );
}

function lazyPage(Page: ReturnType<typeof lazy>) {
  return function LazyPage() {
    return (
      <Suspense fallback={<RoutePending />}>
        <Page />
      </Suspense>
    );
  };
}

function PublicOnlyLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <RoutePending />;
  return isAuthenticated ? <Navigate to="/overview" replace /> : <Outlet />;
}

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}

function AdminOnlyLayout() {
  const profileQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMyProfile,
    staleTime: 300_000,
  });

  if (profileQuery.isLoading) return <RoutePending />;
  return profileQuery.data?.role_name === "ADMIN" ? <Outlet /> : <Navigate to="/overview" replace />;
}

function NotFoundRedirect() {
  return <Navigate to="/" replace />;
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFoundRedirect,
});

const publicRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "public",
  component: PublicOnlyLayout,
});

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: ProtectedLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: "/",
  component: lazyPage(LandingPage),
});

const overviewRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/overview",
  component: lazyPage(Overview),
});

const aipRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/aip",
  component: lazyPage(AIP),
});

const programRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/program",
  component: lazyPage(Program),
});

const projectsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/projects",
  component: lazyPage(Project),
});

const projectCreateRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/projects/create",
  component: lazyPage(CreateProject),
});

const projectDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/projects/$projectId",
  component: lazyPage(ProjectDetail),
});

const monitoringRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/monitoring",
  component: lazyPage(Monitoring),
});

const budgetRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/budget",
  component: lazyPage(Budget),
});

const ganttRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/gantt",
  component: lazyPage(Gannt),
});

const mapRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/map",
  component: lazyPage(Map),
});

const issuesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/issues",
  component: lazyPage(Issues),
});

const auditRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/audit",
  component: lazyPage(Audit),
});

const settingsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  id: "admin-settings",
  component: AdminOnlyLayout,
});

const accountsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  id: "admin-accounts",
  component: AdminOnlyLayout,
});

const settingsIndexRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: "/settings",
  component: lazyPage(Settings),
});

const accountsIndexRoute = createRoute({
  getParentRoute: () => accountsRoute,
  path: "/accounts",
  component: lazyPage(Accounts),
});

const profileRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/profile",
  component: lazyPage(Profile),
});

const routeTree = rootRoute.addChildren([
  publicRoute.addChildren([indexRoute]),
  protectedRoute.addChildren([
    overviewRoute,
    aipRoute,
    programRoute,
    projectsRoute,
    projectCreateRoute,
    projectDetailRoute,
    monitoringRoute,
    budgetRoute,
    ganttRoute,
    mapRoute,
    issuesRoute,
    auditRoute,
    settingsRoute.addChildren([settingsIndexRoute]),
    accountsRoute.addChildren([accountsIndexRoute]),
    profileRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
