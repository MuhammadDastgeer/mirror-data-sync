import { ChevronRight, Users } from "lucide-react";

export type RecentPatient = { id: number; name: string; phone: string | null; created_at: string };

export function RecentPatients({ patients, totalToday }: { patients: RecentPatient[]; totalToday: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold">Recently Registered Patients</h3>
          <p className="text-xs text-muted-foreground">{patients.length} total · {totalToday} registered today</p>
        </div>
        <button className="grid size-8 place-items-center rounded-md border border-input bg-card text-muted-foreground hover:bg-muted">
          <ChevronRight className="size-4" />
        </button>
      </div>

      {patients.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center text-center text-muted-foreground">
          <Users className="size-6 opacity-50" />
          <div className="mt-2 text-sm">No patients registered yet</div>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {patients.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.phone ?? "—"}</div>
              </div>
              <div className="text-xs text-muted-foreground">{p.created_at}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
