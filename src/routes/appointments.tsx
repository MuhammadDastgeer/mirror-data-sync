import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, RefreshCcw, Plus, Clock, CheckCircle2, AlertCircle,
  ClipboardList, XCircle, ChevronRight, Search, Bell, FileText, FileSpreadsheet,
  FileType, Download, Send, X,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { exec, queryAll } from "@/lib/db";

export const Route = createFileRoute("/appointments")({
  head: () => ({
    meta: [
      { title: "Appointments · Code Hospital Admin" },
      { name: "description", content: "Manage hospital appointments and follow-ups." },
    ],
  }),
  component: AppointmentsPage,
});

type Appt = {
  id: number;
  patient_name: string | null;
  patient_phone: string | null;
  doctor_name: string | null;
  department: string | null;
  type: string | null;
  reason: string | null;
  scheduled_at: string;
  scheduled_time: string | null;
  status: string;
  is_follow_up: number;
  follow_up_date: string | null;
  follow_up_status: string | null;
};

function AppointmentsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
          {mounted ? <AppointmentsInner /> : null}
        </main>
      </div>
    </div>
  );
}

function AppointmentsInner() {
  const [tab, setTab] = useState<"appointments" | "follow-ups">("appointments");
  const [tick, setTick] = useState(0);
  const [rows, setRows] = useState<Appt[]>([]);
  const [showBook, setShowBook] = useState(false);

  useEffect(() => {
    queryAll<Appt>("SELECT * FROM appointments ORDER BY id DESC").then(setRows).catch(() => setRows([]));
  }, [tick]);

  const refresh = () => setTick((t) => t + 1);

  return (
    <div className="space-y-5">
      {/* Tab switch + Book button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-xl bg-card p-1 shadow-sm border border-border">
          <TabBtn active={tab === "appointments"} onClick={() => setTab("appointments")} icon={<CalendarDays className="size-4" />}>
            Appointments
          </TabBtn>
          <TabBtn active={tab === "follow-ups"} onClick={() => setTab("follow-ups")} icon={<RefreshCcw className="size-4" />}>
            Follow-ups
          </TabBtn>
        </div>
        <button
          onClick={() => setShowBook(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground shadow-sm hover:opacity-95"
        >
          <Plus className="size-4" /> Book Appointment
        </button>
      </div>

      {tab === "appointments" ? (
        <AppointmentsTab rows={rows} refresh={refresh} />
      ) : (
        <FollowUpsTab rows={rows} refresh={refresh} />
      )}

      {showBook && (
        <BookDialog
          onClose={() => setShowBook(false)}
          onSaved={() => { setShowBook(false); refresh(); }}
        />
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-brand text-brand-foreground shadow-sm" : "text-foreground/70 hover:bg-muted"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

/* ---------------- Appointments tab (screenshot 2.png) ---------------- */
function AppointmentsTab({ rows, refresh }: { rows: Appt[]; refresh: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [showAll, setShowAll] = useState(false);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  const all = rows.filter((r) => r.is_follow_up === 0);
  const todaysAppts = all.filter((r) => r.scheduled_at?.slice(0, 10) === today);
  const completed = all.filter((r) => r.status === "completed" && r.scheduled_at?.slice(0, 10) === today).length;
  const remaining = todaysAppts.length - completed;
  const cancelled = all.filter((r) => r.status === "cancelled").length;

  const filtered = useMemo(() => {
    let f = all;
    if (!showAll) f = f.filter((r) => r.scheduled_at?.slice(0, 10) === date);
    if (status !== "all") f = f.filter((r) => r.status === status);
    if (q.trim()) {
      const s = q.toLowerCase();
      f = f.filter((r) => (r.patient_name ?? "").toLowerCase().includes(s) || (r.doctor_name ?? "").toLowerCase().includes(s));
    }
    return f;
  }, [all, date, showAll, status, q]);

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <ApptKpi tone="teal" icon={<CalendarDays className="size-5" />} label="TODAY'S APPOINTMENTS" value={todaysAppts.length} />
        <ApptKpi tone="green" icon={<CheckCircle2 className="size-5" />} label="COMPLETED" value={completed} />
        <ApptKpi tone="orange" icon={<Clock className="size-5" />} label="REMAINING" value={remaining < 0 ? 0 : remaining} />
        <ApptKpi tone="purple" icon={<ClipboardList className="size-5" />} label="TOTAL APPOINTMENTS" value={all.length} />
        <ApptKpi tone="red" icon={<XCircle className="size-5" />} label="CANCELLED" value={cancelled} />
      </div>

      {/* Book new appointment banner */}
      <button
        onClick={() => document.dispatchEvent(new CustomEvent("open-book"))}
        className="group flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-primary/40 bg-accent/40 px-5 py-4 hover:bg-accent/60 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="grid size-11 place-items-center rounded-xl bg-brand text-brand-foreground">
            <Plus className="size-5" />
          </div>
          <div className="text-left">
            <div className="text-base font-bold text-primary">Book New Appointment</div>
            <div className="text-xs text-muted-foreground">Click to open the quick booking wizard</div>
          </div>
        </div>
        <ChevronRight className="size-5 text-primary group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Listing card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 pb-4">
          <ClipboardList className="size-5 text-foreground" />
          <h2 className="text-lg font-bold tracking-tight">Appointments</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search patient, doctor..."
              className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <label className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
            Show All Appointments
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
          <button onClick={refresh} className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm hover:bg-muted">
            <RefreshCcw className="size-3.5" /> Clear
          </button>
          <div className="relative">
            <button onClick={() => setExportOpen((v) => !v)} className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm hover:bg-muted">
              <Download className="size-3.5" /> Export
            </button>
            {exportOpen && (
              <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-border bg-popover p-1 shadow-lg">
                <ExportItem icon={<FileText className="size-4 text-status-red-fg" />} label="Export as PDF" />
                <ExportItem icon={<FileSpreadsheet className="size-4 text-status-green-fg" />} label="Export as Excel" />
                <ExportItem icon={<FileType className="size-4 text-status-blue-fg" />} label="Export as Word" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-5">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="size-10 text-primary/70" />}
              title="No appointments found"
              sub="Try adjusting the date or filters"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3">Patient</th>
                    <th className="py-2 pr-3">Doctor</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Time</th>
                    <th className="py-2 pr-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-border/60">
                      <td className="py-2 pr-3 font-medium">{r.patient_name ?? "—"}</td>
                      <td className="py-2 pr-3">{r.doctor_name ?? "—"}</td>
                      <td className="py-2 pr-3">{r.type ?? "—"}</td>
                      <td className="py-2 pr-3">{r.scheduled_at?.slice(0, 10)}</td>
                      <td className="py-2 pr-3">{r.scheduled_time ?? "—"}</td>
                      <td className="py-2 pr-3"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExportItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
      {icon}<span>{label}</span>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    scheduled: "bg-status-blue text-status-blue-fg",
    confirmed: "bg-status-cyan text-status-cyan-fg",
    completed: "bg-status-green text-status-green-fg",
    cancelled: "bg-status-red text-status-red-fg",
    pending: "bg-status-yellow text-status-yellow-fg",
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] ?? "bg-muted text-foreground"}`}>{status}</span>;
}

/* ---------------- Follow-ups tab (screenshot 2_1.png) ---------------- */
function FollowUpsTab({ rows, refresh }: { rows: Appt[]; refresh: () => void }) {
  const [bucket, setBucket] = useState<"today" | "upcoming" | "overdue" | "all">("today");
  const [status, setStatus] = useState("all");

  const fus = rows.filter((r) => r.is_follow_up === 1);
  const today = new Date().toISOString().slice(0, 10);

  const counts = {
    today: fus.filter((r) => (r.follow_up_date ?? "").slice(0, 10) === today).length,
    upcoming: fus.filter((r) => (r.follow_up_date ?? "") > today).length,
    overdue: fus.filter((r) => (r.follow_up_date ?? "") < today && r.follow_up_status !== "completed").length,
    all: fus.length,
    pending: fus.filter((r) => r.follow_up_status === "pending").length,
    completed: fus.filter((r) => r.follow_up_status === "completed").length,
  };

  const filtered = useMemo(() => {
    let f = fus;
    if (bucket === "today") f = f.filter((r) => (r.follow_up_date ?? "").slice(0, 10) === today);
    if (bucket === "upcoming") f = f.filter((r) => (r.follow_up_date ?? "") > today);
    if (bucket === "overdue") f = f.filter((r) => (r.follow_up_date ?? "") < today && r.follow_up_status !== "completed");
    if (status !== "all") f = f.filter((r) => r.follow_up_status === status);
    return f;
  }, [fus, bucket, status, today]);

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ApptKpi tone="teal" icon={<Clock className="size-5" />} label="TODAY" value={counts.today} />
        <ApptKpi tone="yellow" icon={<AlertCircle className="size-5" />} label="PENDING" value={counts.pending} />
        <ApptKpi tone="red" icon={<AlertCircle className="size-5" />} label="OVERDUE" value={counts.overdue} />
        <ApptKpi tone="green" icon={<CheckCircle2 className="size-5" />} label="COMPLETED" value={counts.completed} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
          <BucketBtn active={bucket === "today"} onClick={() => setBucket("today")} label="Today" count={counts.today} />
          <BucketBtn active={bucket === "upcoming"} onClick={() => setBucket("upcoming")} label="Upcoming" count={counts.upcoming} />
          <BucketBtn active={bucket === "overdue"} onClick={() => setBucket("overdue")} label="Overdue" count={counts.overdue} />
          <BucketBtn active={bucket === "all"} onClick={() => setBucket("all")} label="All" count={counts.all} />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
          </select>
          <button onClick={refresh} className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm hover:bg-muted">
            <RefreshCcw className="size-3.5" /> Refresh
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-status-yellow bg-status-yellow px-3 py-2 text-sm font-semibold text-status-yellow-fg hover:opacity-90">
            <Bell className="size-3.5" /> Send Reminders
          </button>
        </div>
      </div>

      {/* List card */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={<CalendarDays className="size-10 text-primary/70" />}
              title={bucket === "today" ? "No follow-ups today" : "No follow-ups"}
              sub="Follow-ups will appear here when scheduled from appointment records"
            />
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-3">Patient</th>
                  <th className="py-2 pr-3">Doctor</th>
                  <th className="py-2 pr-3">Reason</th>
                  <th className="py-2 pr-3">Follow-up Date</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="py-2 pr-3 font-medium">{r.patient_name ?? "—"}</td>
                    <td className="py-2 pr-3">{r.doctor_name ?? "—"}</td>
                    <td className="py-2 pr-3">{r.reason ?? "—"}</td>
                    <td className="py-2 pr-3">{r.follow_up_date?.slice(0, 10) ?? "—"}</td>
                    <td className="py-2 pr-3"><StatusBadge status={r.follow_up_status ?? "pending"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function BucketBtn({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-brand text-brand-foreground" : "text-foreground/70 hover:bg-muted"
      }`}
    >
      {label}
      <span className={`grid size-5 place-items-center rounded-full text-[10px] ${active ? "bg-white/20 text-brand-foreground" : "bg-muted text-foreground/60"}`}>
        {count}
      </span>
    </button>
  );
}

/* ---------------- Shared ---------------- */
const toneMap: Record<string, { bg: string; iconBg: string; iconFg: string; valueFg: string }> = {
  teal:   { bg: "bg-kpi-teal",     iconBg: "bg-kpi-teal-fg/15",     iconFg: "text-kpi-teal-fg",     valueFg: "text-kpi-teal-fg" },
  green:  { bg: "bg-kpi-green",    iconBg: "bg-kpi-green-fg/15",    iconFg: "text-kpi-green-fg",    valueFg: "text-kpi-green-fg" },
  orange: { bg: "bg-kpi-orange",   iconBg: "bg-kpi-orange-fg/15",   iconFg: "text-kpi-orange-fg",   valueFg: "text-kpi-orange-fg" },
  purple: { bg: "bg-kpi-purple",   iconBg: "bg-kpi-purple-fg/15",   iconFg: "text-kpi-purple-fg",   valueFg: "text-kpi-purple-fg" },
  red:    { bg: "bg-status-red",   iconBg: "bg-status-red-fg/15",   iconFg: "text-status-red-fg",   valueFg: "text-status-red-fg" },
  yellow: { bg: "bg-status-yellow",iconBg: "bg-status-yellow-fg/15",iconFg: "text-status-yellow-fg",valueFg: "text-status-yellow-fg" },
};
function ApptKpi({ tone, icon, label, value }: { tone: keyof typeof toneMap; icon: React.ReactNode; label: string; value: number }) {
  const t = toneMap[tone];
  return (
    <div className={`rounded-2xl ${t.bg} p-4 flex items-center gap-4`}>
      <div className={`grid size-11 place-items-center rounded-xl ${t.iconBg} ${t.iconFg}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] font-bold tracking-wider text-foreground/70">{label}</div>
        <div className={`mt-0.5 text-3xl font-extrabold tracking-tight ${t.valueFg}`}>{value}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-accent/60">{icon}</div>
      <div className="text-base font-bold text-foreground">{title}</div>
      <div className="text-sm text-muted-foreground">{sub}</div>
    </div>
  );
}

/* ---------------- Book Appointment Dialog ---------------- */
function BookDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    patient_name: "", patient_phone: "", doctor_name: "", department: "",
    type: "Consultation", reason: "", scheduled_at: new Date().toISOString().slice(0, 10),
    scheduled_time: "10:00", status: "scheduled",
    is_follow_up: false, follow_up_date: "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.patient_name.trim()) return alert("Patient name required");
    await exec(
      `INSERT INTO appointments
       (patient_name, patient_phone, doctor_name, department, type, reason, scheduled_at, scheduled_time, status, is_follow_up, follow_up_date, follow_up_status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        form.patient_name, form.patient_phone, form.doctor_name, form.department,
        form.type, form.reason, form.scheduled_at, form.scheduled_time, form.status,
        form.is_follow_up ? 1 : 0, form.is_follow_up ? form.follow_up_date : null,
        form.is_follow_up ? "pending" : null,
      ],
    );
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-lg font-bold">Book Appointment</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted"><X className="size-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Patient Name"><input className={inputCls} value={form.patient_name} onChange={(e) => set("patient_name", e.target.value)} /></Field>
          <Field label="Phone"><input className={inputCls} value={form.patient_phone} onChange={(e) => set("patient_phone", e.target.value)} /></Field>
          <Field label="Doctor"><input className={inputCls} value={form.doctor_name} onChange={(e) => set("doctor_name", e.target.value)} /></Field>
          <Field label="Department"><input className={inputCls} value={form.department} onChange={(e) => set("department", e.target.value)} /></Field>
          <Field label="Type">
            <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value)}>
              <option>Consultation</option><option>Check-up</option><option>Procedure</option><option>Surgery</option>
            </select>
          </Field>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Field>
          <Field label="Date"><input type="date" className={inputCls} value={form.scheduled_at} onChange={(e) => set("scheduled_at", e.target.value)} /></Field>
          <Field label="Time"><input type="time" className={inputCls} value={form.scheduled_time} onChange={(e) => set("scheduled_time", e.target.value)} /></Field>
          <div className="col-span-2">
            <Field label="Reason"><textarea rows={2} className={inputCls} value={form.reason} onChange={(e) => set("reason", e.target.value)} /></Field>
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_follow_up} onChange={(e) => set("is_follow_up", e.target.checked)} />
            Schedule as Follow-up
          </label>
          {form.is_follow_up && (
            <div className="col-span-2">
              <Field label="Follow-up Date"><input type="date" className={inputCls} value={form.follow_up_date} onChange={(e) => set("follow_up_date", e.target.value)} /></Field>
            </div>
          )}
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-muted">Cancel</button>
          <button onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:opacity-95">
            <Send className="size-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
