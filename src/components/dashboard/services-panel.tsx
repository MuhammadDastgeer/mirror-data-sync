import { BarChart3, Building2, ChevronRight } from "lucide-react";

function Tag({ tone, children }: { tone: "blue" | "green" | "purple"; children: React.ReactNode }) {
  const map = {
    blue: "bg-status-blue text-status-blue-fg",
    green: "bg-status-green text-status-green-fg",
    purple: "bg-status-purple text-status-purple-fg",
  } as const;
  return <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${map[tone]}`}>{children}</span>;
}

export function ServicesPanel() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-status-blue text-status-blue-fg">
              <BarChart3 className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Services & Treatment Dashboard</h3>
              <p className="text-xs text-muted-foreground">Service packages, treatment plan stats, session completion</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Tag tone="blue">Service Packages</Tag>
          <Tag tone="green">Treatment Plans</Tag>
          <Tag tone="purple">Permissions</Tag>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-status-mint text-status-mint-fg">
              <Building2 className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Departments & Sub-Depts</h3>
              <p className="text-xs text-muted-foreground">Manage departments, sub-departments and procedures</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Tag tone="blue">Departments</Tag>
          <Tag tone="green">Sub-Depts</Tag>
          <Tag tone="purple">Staff</Tag>
        </div>
      </div>
    </div>
  );
}
