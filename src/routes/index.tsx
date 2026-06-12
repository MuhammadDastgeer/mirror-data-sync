import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { StatusPills } from "@/components/dashboard/status-pills";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { LiveAlerts } from "@/components/dashboard/live-alerts";
import { RecentPatients } from "@/components/dashboard/recent-patients";
import { ServicesPanel } from "@/components/dashboard/services-panel";
import { RightPanel } from "@/components/dashboard/right-panel";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Code Hospital Admin" },
      { name: "description", content: "Hospital admin dashboard for staff, appointments, billing, inventory and patients." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <div className="flex min-w-0 flex-1 overflow-hidden">
          <main className="min-w-0 flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {mounted ? <DashboardInner /> : <DashboardSkeleton />}
          </main>
          {mounted && (
            <div className="hidden xl:block h-full overflow-y-auto">
              <RightPanelLive />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardInner() {
  const { data, refresh } = useDashboardData();
  if (!data) return <DashboardSkeleton />;
  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-xs text-muted-foreground">Last updated {data.lastUpdated}</p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          <RefreshCcw className="size-3.5" /> Refresh
        </button>
      </div>

      <KpiCards
        doctors={data.doctors}
        patients={data.patients}
        patientsThisMonth={data.patientsThisMonth}
        todayAppts={data.todayAppts}
        todayCompleted={data.todayCompleted}
        revenueToday={data.revenueToday}
        revenueThisMonth={data.revenueThisMonth}
      />

      <StatusPills data={data.status} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <ActivityChart data={data.monthly} />
        <LiveAlerts alerts={data.alerts} />
      </div>

      <RecentPatients patients={data.recentPatients} totalToday={data.registeredToday} />

      <ServicesPanel />
    </>
  );
}

function RightPanelLive() {
  const { data } = useDashboardData();
  return (
    <RightPanel
      doctorsOnDuty={data?.doctorsOnDuty ?? 0}
      summary={data?.summary ?? { followUps: 0, newPatients: 0, revenue: 0, lowStock: 0 }}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
