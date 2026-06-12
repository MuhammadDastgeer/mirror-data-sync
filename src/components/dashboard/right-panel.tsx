import { ChevronLeft, ChevronRight, CalendarX } from "lucide-react";
import { useMemo, useState } from "react";

function buildMonthGrid(year: number, month: number) {
  // month: 0-11. Returns weeks starting Monday.
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = (first.getDay() + 6) % 7; // Mon=0
  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function RightPanel({
  doctorsOnDuty,
  summary,
}: {
  doctorsOnDuty: number;
  summary: { followUps: number; newPatients: number; revenue: number; lowStock: number };
}) {
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const weeks = useMemo(() => buildMonthGrid(cursor.y, cursor.m), [cursor]);

  const isToday = (d: number | null) =>
    d !== null && cursor.y === today.getFullYear() && cursor.m === today.getMonth() && d === today.getDate();

  const prev = () => setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }));
  const next = () => setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }));

  return (
    <aside className="hidden xl:flex w-72 shrink-0 flex-col gap-6 border-l border-border bg-background px-5 py-6">
      {/* Date / calendar */}
      <div>
        <div className="text-[11px] font-bold tracking-wider text-muted-foreground">DATE</div>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-lg font-bold">{MONTHS[cursor.m]} {cursor.y}</div>
          <div className="flex items-center gap-1.5">
            <button onClick={prev} className="grid size-7 place-items-center rounded-md border border-input bg-card text-muted-foreground hover:bg-muted">
              <ChevronLeft className="size-4" />
            </button>
            <button onClick={next} className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground hover:opacity-90">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-y-2 text-center text-[11px] font-semibold text-muted-foreground">
          {["M","T","W","T","F","S","S"].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-y-1 text-center text-sm">
          {weeks.flat().map((d, i) => (
            <div key={i} className="py-1">
              {d === null ? (
                <span className="text-transparent">.</span>
              ) : isToday(d) ? (
                <span className="inline-grid size-7 place-items-center rounded-md bg-primary font-bold text-primary-foreground">{d}</span>
              ) : (
                <span className="text-foreground/80">{d}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Doctors on duty */}
      <div>
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Doctors on Duty Today</div>
          <div className="grid size-6 place-items-center rounded-md bg-muted text-xs font-bold text-foreground">{doctorsOnDuty}</div>
        </div>
        <div className="mt-4 flex flex-col items-center justify-center text-center text-muted-foreground">
          <CalendarX className="size-7 opacity-60" />
          <div className="mt-2 text-xs">No appointments today</div>
        </div>
      </div>

      {/* Today's summary */}
      <div>
        <div className="mb-3 text-sm font-semibold">Today's Summary</div>
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          <Row label="Follow-ups" value={String(summary.followUps)} />
          <Row label="New Patients" value={String(summary.newPatients)} />
          <Row label="Revenue" value={`Rs.${summary.revenue}`} valueClass="text-kpi-orange-fg" />
          <Row label="Low Stock" value={String(summary.lowStock)} />
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="text-foreground/80">{label}</span>
      <span className={`font-bold ${valueClass || "text-foreground"}`}>{value}</span>
    </div>
  );
}
