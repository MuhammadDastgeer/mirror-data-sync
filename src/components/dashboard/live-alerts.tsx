import { Activity, ShieldCheck } from "lucide-react";

export function LiveAlerts({ alerts }: { alerts: { id: number; message: string; severity: string }[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 h-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold">Live Alerts</h3>
        <Activity className="size-4 text-muted-foreground" />
      </div>
      {alerts.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center text-center">
          <div className="grid size-10 place-items-center rounded-full bg-status-green text-status-green-fg">
            <ShieldCheck className="size-5" />
          </div>
          <div className="mt-3 text-sm text-muted-foreground">All systems normal</div>
        </div>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.id} className="rounded-lg bg-muted px-3 py-2 text-sm">{a.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
