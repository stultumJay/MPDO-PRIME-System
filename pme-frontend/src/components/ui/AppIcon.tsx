import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Download,
  FileText,
  Folder,
  FolderOpen,
  History,
  ImageIcon,
  LayoutDashboard,
  List,
  ListPlus,
  LogOut,
  Map,
  Pencil,
  Plus,
  PlusCircle,
  RefreshCw,
  Search,
  Settings,
  Timer,
  TriangleAlert,
  UserRound,
  UsersRound,
  Wallet,
  WalletCards,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  account_balance: Building2,
  account_balance_wallet: Wallet,
  add: Plus,
  add_circle: PlusCircle,
  analytics: BarChart3,
  assessment: BarChart3,
  arrow_back: ArrowLeft,
  calendar_today: CalendarDays,
  check_circle: CheckCircle2,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  dashboard: LayoutDashboard,
  description: FileText,
  download: Download,
  edit: Pencil,
  folder: Folder,
  folder_open: FolderOpen,
  help: CircleHelp,
  history: History,
  image_search: ImageIcon,
  logout: LogOut,
  manage_accounts: UsersRound,
  map: Map,
  notifications: Bell,
  payments: WalletCards,
  person: UserRound,
  playlist_add: ListPlus,
  radio_button_checked: CheckCircle2,
  refresh: RefreshCw,
  report: TriangleAlert,
  search: Search,
  settings: Settings,
  sync: RefreshCw,
  timeline: Timer,
  trending_up: BarChart3,
  view_list: List,
  warning: TriangleAlert,
};

type AppIconProps = {
  name: string;
  className?: string;
  strokeWidth?: number;
};

export function AppIcon({ name, className, strokeWidth = 2 }: AppIconProps) {
  const Icon = ICONS[name] ?? CircleHelp;
  return <Icon aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
}
