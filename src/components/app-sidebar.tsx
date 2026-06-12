import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarDays,
  Stethoscope,
  Receipt,
  Boxes,
  BedDouble,
  Users,
  UserRound,
  UsersRound,
  Building2,
  MessageSquare,
  Plane,
  FileText,
  BarChart3,
  Wallet,
  Settings,
  LifeBuoy,
  LogOut,
  Activity,
} from "lucide-react";

const general = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Appointments", url: "/appointments", icon: CalendarDays },
  { title: "Consultation", url: "/consultation", icon: Stethoscope },
  { title: "Billing", url: "/billing", icon: Receipt },
  { title: "Inventory", url: "/inventory", icon: Boxes },
  { title: "IPD / Wards", url: "/ipd", icon: BedDouble },
  { title: "Staff", url: "/staff", icon: Users },
  { title: "Doctors", url: "/doctors", icon: UserRound },
  { title: "Patients", url: "/patients", icon: UsersRound },
  { title: "Departments", url: "/departments", icon: Building2 },
  { title: "Enquiries", url: "/enquiries", icon: MessageSquare },
  { title: "Medical Tourism", url: "/medical-tourism", icon: Plane },
  { title: "Blogs", url: "/blogs", icon: FileText },
];

const system = [
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Finance", url: "/finance", icon: Wallet },
  { title: "Configure Hospital", url: "/configure", icon: Settings },
  { title: "Support", url: "/support", icon: LifeBuoy },
];

export function AppSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => currentPath === url;

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-6">
        <div className="grid size-10 place-items-center rounded-xl bg-brand text-brand-foreground shadow-sm">
          <Activity className="size-5" />
        </div>
        <div className="leading-tight">
          <div className="text-base font-bold text-foreground">Code</div>
          <div className="text-xs text-muted-foreground">Hospital Admin</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="px-3 pb-2 pt-1 text-[11px] font-semibold tracking-wider text-muted-foreground">
          GENERAL
        </div>
        <ul className="space-y-0.5">
          {general.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.url);
            return (
              <li key={item.title}>
                <Link
                  to={item.url}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      : "text-foreground/80 hover:bg-muted"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="px-3 pb-2 pt-5 text-[11px] font-semibold tracking-wider text-muted-foreground">
          SYSTEM
        </div>
        <ul className="space-y-0.5">
          {system.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.url);
            return (
              <li key={item.title}>
                <Link
                  to={item.url}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      : "text-foreground/80 hover:bg-muted"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User card + logout */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2">
          <div className="grid size-9 place-items-center rounded-lg bg-brand text-brand-foreground text-xs font-bold">
            MH
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold">Muhammad Hamza</div>
            <div className="truncate text-xs text-muted-foreground">Hospital Admin</div>
          </div>
        </div>
        <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-status-red bg-status-red/40 px-3 py-2 text-sm font-semibold text-status-red-fg hover:bg-status-red/60 transition-colors">
          <LogOut className="size-4" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
