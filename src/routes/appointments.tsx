import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, RefreshCcw, Plus, Clock, CheckCircle2, AlertCircle,
  ClipboardList, XCircle, ChevronRight, Search, Bell, FileText, FileSpreadsheet,
  FileType, Download, X, User, Stethoscope, CalendarCheck, Zap, Pencil, Trash2, Eye,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { exec, queryAll, queryOne } from "@/lib/db";

export const Route = createFileRoute("/appointments")({
  head: () => ({
    meta: [
      { title: "Appointments · Code Hospital Admin" },
      { name: "description", content: "Manage hospital appointments and follow-ups." },
    ],
  }),
  component: AppointmentsPage,
});

type Patient = {
  id: number; name: string; email: string | null; phone: string | null;
  whatsapp: string | null; gender: string | null; age: number | null; created_at: string;
};
type Doctor = {
  id: number; name: string; specialty: string | null; active: number; on_duty: number; created_at: string;
};
type Appt = {
  id: number;
  patient_id: number | null;
  doctor_id: number | null;
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
  const [editing, setEditing] = useState<Appt | null>(null);
  const [viewing, setViewing] = useState<Appt | null>(null);
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    queryAll<Appt>("SELECT * FROM appointments ORDER BY id DESC").then(setRows).catch(() => setRows([]));
  }, [tick]);

  const refresh = () => setTick((t) => t + 1);

  return (
    <div className="space-y-5">
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
        <AppointmentsTab rows={rows} refresh={refresh} onOpenBook={() => setShowBook(true)}
          onView={setViewing} onEdit={setEditing}
          q={searchQ} setQ={setSearchQ} />
      ) : (
        <FollowUpsTab rows={rows} refresh={refresh} onView={setViewing} onEdit={setEditing} />
      )}

      {showBook && (
        <BookWizard
          initialQuery={searchQ}
          onClose={() => setShowBook(false)}
          onSaved={() => { setShowBook(false); refresh(); }}
        />
      )}
      {editing && (
        <EditDialog appt={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />
      )}
      {viewing && (
        <DetailsDialog appt={viewing} onClose={() => setViewing(null)} />
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
      {icon}{children}
    </button>
  );
}

/* ============== Appointments Tab ============== */
function AppointmentsTab({
  rows, refresh, onOpenBook, onView, onEdit, q, setQ,
}: {
  rows: Appt[]; refresh: () => void; onOpenBook: () => void;
  onView: (a: Appt) => void; onEdit: (a: Appt) => void;
  q: string; setQ: (v: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [showAll, setShowAll] = useState(false);
  const [status, setStatus] = useState("all");
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
      f = f.filter((r) =>
        (r.patient_name ?? "").toLowerCase().includes(s) ||
        (r.doctor_name ?? "").toLowerCase().includes(s) ||
        (r.patient_phone ?? "").toLowerCase().includes(s)
      );
    }
    return f;
  }, [all, date, showAll, status, q]);

  const remove = async (id: number) => {
    if (!confirm("Delete this appointment?")) return;
    await exec("DELETE FROM appointments WHERE id=?", [id]);
    refresh();
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <ApptKpi tone="teal" icon={<CalendarDays className="size-5" />} label="TODAY'S APPOINTMENTS" value={todaysAppts.length} />
        <ApptKpi tone="green" icon={<CheckCircle2 className="size-5" />} label="COMPLETED" value={completed} />
        <ApptKpi tone="orange" icon={<Clock className="size-5" />} label="REMAINING" value={remaining < 0 ? 0 : remaining} />
        <ApptKpi tone="purple" icon={<ClipboardList className="size-5" />} label="TOTAL APPOINTMENTS" value={all.length} />
        <ApptKpi tone="red" icon={<XCircle className="size-5" />} label="CANCELLED" value={cancelled} />
      </div>

      <button
        onClick={onOpenBook}
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
                    <th className="py-2 pr-3">Phone</th>
                    <th className="py-2 pr-3">Doctor</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Time</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="cursor-pointer border-b border-border/60 hover:bg-muted/40" onClick={() => onView(r)}>
                      <td className="py-2 pr-3 font-medium">{r.patient_name ?? "—"}</td>
                      <td className="py-2 pr-3">{r.patient_phone ?? "—"}</td>
                      <td className="py-2 pr-3">{r.doctor_name ?? "—"}</td>
                      <td className="py-2 pr-3">{r.type ?? "—"}</td>
                      <td className="py-2 pr-3">{r.scheduled_at?.slice(0, 10)}</td>
                      <td className="py-2 pr-3">{r.scheduled_time ?? "—"}</td>
                      <td className="py-2 pr-3"><StatusBadge status={r.status} /></td>
                      <td className="py-2 pr-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          <IconBtn title="View" onClick={() => onView(r)}><Eye className="size-3.5" /></IconBtn>
                          <IconBtn title="Edit" onClick={() => onEdit(r)}><Pencil className="size-3.5" /></IconBtn>
                          <IconBtn title="Delete" danger onClick={() => remove(r.id)}><Trash2 className="size-3.5" /></IconBtn>
                        </div>
                      </td>
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

function IconBtn({ title, onClick, danger, children }: { title: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      title={title} onClick={onClick}
      className={`grid size-7 place-items-center rounded-md border border-border bg-background hover:bg-muted ${danger ? "text-status-red-fg" : "text-foreground"}`}
    >
      {children}
    </button>
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
    overdue: "bg-status-red text-status-red-fg",
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] ?? "bg-muted text-foreground"}`}>{status}</span>;
}

/* ============== Follow-ups Tab ============== */
function FollowUpsTab({
  rows, refresh, onView, onEdit,
}: { rows: Appt[]; refresh: () => void; onView: (a: Appt) => void; onEdit: (a: Appt) => void }) {
  const [bucket, setBucket] = useState<"today" | "upcoming" | "overdue" | "all">("today");
  const [status, setStatus] = useState("all");
  const today = new Date().toISOString().slice(0, 10);
  const fus = rows.filter((r) => r.is_follow_up === 1);

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

  const remove = async (id: number) => {
    if (!confirm("Delete this follow-up?")) return;
    await exec("DELETE FROM appointments WHERE id=?", [id]);
    refresh();
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ApptKpi tone="teal" icon={<Clock className="size-5" />} label="TODAY" value={counts.today} />
        <ApptKpi tone="yellow" icon={<AlertCircle className="size-5" />} label="PENDING" value={counts.pending} />
        <ApptKpi tone="red" icon={<AlertCircle className="size-5" />} label="OVERDUE" value={counts.overdue} />
        <ApptKpi tone="green" icon={<CheckCircle2 className="size-5" />} label="COMPLETED" value={counts.completed} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
          <BucketBtn active={bucket === "today"} onClick={() => setBucket("today")} label="Today" count={counts.today} />
          <BucketBtn active={bucket === "upcoming"} onClick={() => setBucket("upcoming")} label="Upcoming" count={counts.upcoming} />
          <BucketBtn active={bucket === "overdue"} onClick={() => setBucket("overdue")} label="Overdue" count={counts.overdue} />
          <BucketBtn active={bucket === "all"} onClick={() => setBucket("all")} label="All" count={counts.all} />
        </div>
        <div className="flex items-center gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary">
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
                  <th className="py-2 pr-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="cursor-pointer border-b border-border/60 hover:bg-muted/40" onClick={() => onView(r)}>
                    <td className="py-2 pr-3 font-medium">{r.patient_name ?? "—"}</td>
                    <td className="py-2 pr-3">{r.doctor_name ?? "—"}</td>
                    <td className="py-2 pr-3">{r.reason ?? "—"}</td>
                    <td className="py-2 pr-3">{r.follow_up_date?.slice(0, 10) ?? "—"}</td>
                    <td className="py-2 pr-3"><StatusBadge status={r.follow_up_status ?? "pending"} /></td>
                    <td className="py-2 pr-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        <IconBtn title="View" onClick={() => onView(r)}><Eye className="size-3.5" /></IconBtn>
                        <IconBtn title="Edit" onClick={() => onEdit(r)}><Pencil className="size-3.5" /></IconBtn>
                        <IconBtn title="Delete" danger onClick={() => remove(r.id)}><Trash2 className="size-3.5" /></IconBtn>
                      </div>
                    </td>
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
    <button onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-brand text-brand-foreground" : "text-foreground/70 hover:bg-muted"
      }`}>
      {label}
      <span className={`grid size-5 place-items-center rounded-full text-[10px] ${active ? "bg-white/20 text-brand-foreground" : "bg-muted text-foreground/60"}`}>
        {count}
      </span>
    </button>
  );
}

/* ============== KPI / Empty ============== */
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

/* ============== Book Wizard (4 steps) ============== */
type Step = 1 | 2 | 3 | 4;

function BookWizard({ onClose, onSaved, initialQuery }: { onClose: () => void; onSaved: () => void; initialQuery?: string }) {
  const [step, setStep] = useState<Step>(1);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [sched, setSched] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: "10:00",
    type: "Consultation",
    reason: "",
    is_follow_up: false,
    follow_up_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [dupWarn, setDupWarn] = useState<string | null>(null);

  const canNext =
    (step === 1 && !!patient) ||
    (step === 2 && !!doctor) ||
    (step === 3 && !!sched.date && !!sched.time);

  const submit = async () => {
    if (!patient || !doctor) return;
    setSaving(true);
    setDupWarn(null);
    const dup = await queryOne<{ id: number }>(
      "SELECT id FROM appointments WHERE patient_id=? AND doctor_id=? AND scheduled_at=? AND scheduled_time=?",
      [patient.id, doctor.id, sched.date, sched.time],
    );
    if (dup) {
      setDupWarn("This appointment already exists for the same patient, doctor, date and time.");
      setSaving(false);
      return;
    }
    await exec(
      `INSERT INTO appointments
        (patient_id, doctor_id, patient_name, patient_phone, doctor_name, department, type, reason,
         scheduled_at, scheduled_time, status, is_follow_up, follow_up_date, follow_up_status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        patient.id, doctor.id, patient.name, patient.phone, doctor.name, doctor.specialty,
        sched.type, sched.reason, sched.date, sched.time, "scheduled",
        sched.is_follow_up ? 1 : 0,
        sched.is_follow_up ? sched.follow_up_date : null,
        sched.is_follow_up ? "pending" : null,
      ],
    );
    setSaving(false);
    onSaved();
  };

  return (
    <Modal onClose={onClose} title={<><Zap className="size-5 text-primary" /> Quick Book Appointment</>}>
      <Stepper step={step} />
      <div className="mt-4">
        {step === 1 && <StepPatient selected={patient} onSelect={setPatient} initialQuery={initialQuery} />}
        {step === 2 && <StepDoctor selected={doctor} onSelect={setDoctor} />}
        {step === 3 && <StepSchedule value={sched} onChange={setSched} />}
        {step === 4 && (
          <StepConfirm patient={patient!} doctor={doctor!} sched={sched} dupWarn={dupWarn} />
        )}
      </div>
      <div className="mt-5 flex items-center justify-between gap-2">
        <button onClick={onClose} className="rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-muted">
          Cancel
        </button>
        <div className="flex items-center gap-2">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-muted"
            >
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              disabled={!canNext}
              onClick={() => setStep((s) => (s + 1) as Step)}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              disabled={saving}
              onClick={submit}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-50"
            >
              <CheckCircle2 className="size-4" /> Confirm & Book
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Stepper({ step }: { step: Step }) {
  const items: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: 1, label: "Patient", icon: <User className="size-4" /> },
    { id: 2, label: "Doctor", icon: <Stethoscope className="size-4" /> },
    { id: 3, label: "Schedule", icon: <CalendarDays className="size-4" /> },
    { id: 4, label: "Confirm", icon: <CheckCircle2 className="size-4" /> },
  ];
  return (
    <div className="flex items-center gap-2">
      {items.map((it, i) => (
        <div key={it.id} className="flex flex-1 items-center gap-2">
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
              step === it.id
                ? "border-primary bg-accent/50 text-primary"
                : step > it.id
                  ? "border-primary/40 bg-accent/30 text-primary"
                  : "border-border text-muted-foreground"
            }`}
          >
            {it.icon}<span>{it.label}</span>
          </div>
          {i < items.length - 1 && <div className={`h-px flex-1 ${step > it.id ? "bg-primary/50" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );
}

/* --- Step 1: Patient --- */
function StepPatient({ selected, onSelect, initialQuery }: { selected: Patient | null; onSelect: (p: Patient) => void; initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery ?? "");
  const [results, setResults] = useState<Patient[]>([]);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) { setResults([]); return; }
      const s = `%${q.trim()}%`;
      const r = await queryAll<Patient>(
        "SELECT * FROM patients WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR whatsapp LIKE ? ORDER BY id DESC LIMIT 25",
        [s, s, s, s],
      );
      setResults(r);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  if (showNew) {
    return <NewPatientForm
      defaultName={q}
      onCancel={() => setShowNew(false)}
      onCreated={(p) => { onSelect(p); setShowNew(false); }}
    />;
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold tracking-wider text-muted-foreground">SEARCH PATIENT</div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, phone, or Patient ID..."
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary"
            autoFocus
          />
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-primary px-3 py-2 text-sm font-semibold text-primary hover:bg-accent/40"
        >
          <Plus className="size-4" /> New Patient
        </button>
      </div>

      {q.trim() && results.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          No patients matched. Click <strong>+ New Patient</strong> to add.
        </div>
      )}

      <div className="max-h-64 space-y-2 overflow-y-auto">
        {results.map((p) => (
          <button key={p.id} onClick={() => onSelect(p)}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
              selected?.id === p.id ? "border-primary bg-accent/40" : "border-border bg-background hover:bg-muted"
            }`}>
            <div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-xs text-muted-foreground">
                {[p.phone, p.email, p.gender].filter(Boolean).join(" • ") || "—"}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">#{p.id}</div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="rounded-lg border border-primary/40 bg-accent/30 p-3 text-sm">
          <span className="font-semibold">Selected:</span> {selected.name} {selected.phone ? `· ${selected.phone}` : ""}
        </div>
      )}
    </div>
  );
}

function NewPatientForm({
  defaultName, onCancel, onCreated,
}: { defaultName: string; onCancel: () => void; onCreated: (p: Patient) => void }) {
  const [f, setF] = useState({ name: defaultName, email: "", phone: "", whatsapp: "", gender: "male", age: "" });
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    setErr(null);
    if (!f.name.trim()) return setErr("Name is required");
    if (!f.phone.trim()) return setErr("Phone is required");
    // Duplicate check by phone or email
    const dup = await queryOne<Patient>(
      "SELECT * FROM patients WHERE phone=? OR (email IS NOT NULL AND email!='' AND email=?) LIMIT 1",
      [f.phone.trim(), f.email.trim()],
    );
    if (dup) {
      if (!confirm(`A patient already exists: ${dup.name} (${dup.phone}). Use existing record?`)) return;
      return onCreated(dup);
    }
    await exec(
      "INSERT INTO patients (name, email, phone, whatsapp, gender, age) VALUES (?,?,?,?,?,?)",
      [f.name.trim(), f.email.trim() || null, f.phone.trim(), f.whatsapp.trim() || null, f.gender, f.age ? Number(f.age) : null],
    );
    const created = await queryOne<Patient>("SELECT * FROM patients ORDER BY id DESC LIMIT 1");
    if (created) onCreated(created);
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold tracking-wider text-muted-foreground">NEW PATIENT</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Full Name *"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Email"><input type="email" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Phone *"><input className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="WhatsApp"><input className={inputCls} value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></Field>
        <Field label="Gender">
          <select className={inputCls} value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}>
            <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
          </select>
        </Field>
        <Field label="Age"><input type="number" min="0" className={inputCls} value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} /></Field>
      </div>
      {err && <div className="rounded-lg border border-status-red/40 bg-status-red/30 px-3 py-2 text-sm text-status-red-fg">{err}</div>}
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-muted">Cancel</button>
        <button onClick={save} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">Save Patient</button>
      </div>
    </div>
  );
}

/* --- Step 2: Doctor (existing only) --- */
function StepDoctor({ selected, onSelect }: { selected: Doctor | null; onSelect: (d: Doctor) => void }) {
  const [docs, setDocs] = useState<Doctor[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    queryAll<Doctor>("SELECT * FROM doctors WHERE active=1 ORDER BY name ASC")
      .then(setDocs)
      .catch(() => setDocs([]));
  }, []);

  const filtered = docs.filter((d) =>
    !q.trim() ||
    d.name.toLowerCase().includes(q.toLowerCase()) ||
    (d.specialty ?? "").toLowerCase().includes(q.toLowerCase()) ||
    (d.department ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold tracking-wider text-muted-foreground">SELECT DOCTOR</div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search saved doctor by name, specialty or department..."
          className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary" />
      </div>

      <div className="max-h-72 space-y-2 overflow-y-auto">
        {docs.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            No saved doctors yet. Add doctors from the <strong>Doctors</strong> page first.
          </div>
        )}
        {docs.length > 0 && filtered.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            No doctors match your search.
          </div>
        )}
        {filtered.map((d) => (
          <button key={d.id} onClick={() => onSelect(d)}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
              selected?.id === d.id ? "border-primary bg-accent/40" : "border-border bg-background hover:bg-muted"
            }`}>
            <div>
              <div className="font-semibold">{d.name}</div>
              <div className="text-xs text-muted-foreground">
                {[d.specialty ?? "General", d.department].filter(Boolean).join(" • ")}
              </div>
            </div>
            {d.on_duty ? (
              <span className="rounded-full bg-status-green px-2 py-0.5 text-xs font-semibold text-status-green-fg">On Duty</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

/* --- Step 3: Schedule --- */
type SchedVal = {
  date: string; time: string; type: string; reason: string;
  is_follow_up: boolean; follow_up_date: string;
};
function StepSchedule({ value, onChange }: { value: SchedVal; onChange: (v: SchedVal) => void }) {
  const set = <K extends keyof SchedVal>(k: K, v: SchedVal[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-3">
      <div className="text-xs font-bold tracking-wider text-muted-foreground">SCHEDULE</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><input type="date" className={inputCls} value={value.date} onChange={(e) => set("date", e.target.value)} /></Field>
        <Field label="Time"><input type="time" className={inputCls} value={value.time} onChange={(e) => set("time", e.target.value)} /></Field>
        <Field label="Type">
          <select className={inputCls} value={value.type} onChange={(e) => set("type", e.target.value)}>
            <option>Consultation</option><option>Check-up</option><option>Procedure</option><option>Surgery</option>
          </select>
        </Field>
        <div />
        <div className="col-span-2">
          <Field label="Reason"><textarea rows={2} className={inputCls} value={value.reason} onChange={(e) => set("reason", e.target.value)} /></Field>
        </div>
        <label className="col-span-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={value.is_follow_up} onChange={(e) => set("is_follow_up", e.target.checked)} />
          Schedule as Follow-up
        </label>
        {value.is_follow_up && (
          <div className="col-span-2">
            <Field label="Follow-up Date"><input type="date" className={inputCls} value={value.follow_up_date} onChange={(e) => set("follow_up_date", e.target.value)} /></Field>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Step 4: Confirm --- */
function StepConfirm({ patient, doctor, sched, dupWarn }: {
  patient: Patient; doctor: Doctor; sched: SchedVal; dupWarn: string | null;
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-bold tracking-wider text-muted-foreground">CONFIRM DETAILS</div>
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
        <Row k="Patient" v={`${patient.name}${patient.phone ? " · " + patient.phone : ""}`} />
        <Row k="Email" v={patient.email ?? "—"} />
        <Row k="WhatsApp" v={patient.whatsapp ?? "—"} />
        <Row k="Gender / Age" v={`${patient.gender ?? "—"} / ${patient.age ?? "—"}`} />
        <hr className="my-2 border-border" />
        <Row k="Doctor" v={`${doctor.name}${doctor.specialty ? " · " + doctor.specialty : ""}`} />
        <hr className="my-2 border-border" />
        <Row k="Date" v={sched.date} />
        <Row k="Time" v={sched.time} />
        <Row k="Type" v={sched.type} />
        <Row k="Reason" v={sched.reason || "—"} />
        {sched.is_follow_up && <Row k="Follow-up" v={sched.follow_up_date || "—"} />}
      </div>
      {dupWarn && (
        <div className="rounded-lg border border-status-red/40 bg-status-red/30 px-3 py-2 text-sm text-status-red-fg">
          {dupWarn}
        </div>
      )}
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 py-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}

/* ============== Edit / Details ============== */
function EditDialog({ appt, onClose, onSaved }: { appt: Appt; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    patient_name: appt.patient_name ?? "",
    patient_phone: appt.patient_phone ?? "",
    doctor_name: appt.doctor_name ?? "",
    department: appt.department ?? "",
    type: appt.type ?? "Consultation",
    reason: appt.reason ?? "",
    scheduled_at: appt.scheduled_at.slice(0, 10),
    scheduled_time: appt.scheduled_time ?? "10:00",
    status: appt.status,
    is_follow_up: appt.is_follow_up === 1,
    follow_up_date: appt.follow_up_date?.slice(0, 10) ?? "",
    follow_up_status: appt.follow_up_status ?? "pending",
  });
  const save = async () => {
    await exec(
      `UPDATE appointments SET patient_name=?, patient_phone=?, doctor_name=?, department=?, type=?, reason=?,
        scheduled_at=?, scheduled_time=?, status=?, is_follow_up=?, follow_up_date=?, follow_up_status=? WHERE id=?`,
      [
        f.patient_name, f.patient_phone, f.doctor_name, f.department, f.type, f.reason,
        f.scheduled_at, f.scheduled_time, f.status,
        f.is_follow_up ? 1 : 0, f.is_follow_up ? f.follow_up_date : null,
        f.is_follow_up ? f.follow_up_status : null,
        appt.id,
      ],
    );
    onSaved();
  };
  return (
    <Modal onClose={onClose} title={<><Pencil className="size-4 text-primary" /> Edit Appointment #{appt.id}</>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Patient Name"><input className={inputCls} value={f.patient_name} onChange={(e) => setF({ ...f, patient_name: e.target.value })} /></Field>
        <Field label="Phone"><input className={inputCls} value={f.patient_phone} onChange={(e) => setF({ ...f, patient_phone: e.target.value })} /></Field>
        <Field label="Doctor"><input className={inputCls} value={f.doctor_name} onChange={(e) => setF({ ...f, doctor_name: e.target.value })} /></Field>
        <Field label="Department"><input className={inputCls} value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} /></Field>
        <Field label="Type">
          <select className={inputCls} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
            <option>Consultation</option><option>Check-up</option><option>Procedure</option><option>Surgery</option>
          </select>
        </Field>
        <Field label="Status">
          <select className={inputCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="scheduled">Scheduled</option><option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
          </select>
        </Field>
        <Field label="Date"><input type="date" className={inputCls} value={f.scheduled_at} onChange={(e) => setF({ ...f, scheduled_at: e.target.value })} /></Field>
        <Field label="Time"><input type="time" className={inputCls} value={f.scheduled_time} onChange={(e) => setF({ ...f, scheduled_time: e.target.value })} /></Field>
        <div className="col-span-2">
          <Field label="Reason"><textarea rows={2} className={inputCls} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
        </div>
        <label className="col-span-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.is_follow_up} onChange={(e) => setF({ ...f, is_follow_up: e.target.checked })} />
          Follow-up
        </label>
        {f.is_follow_up && (
          <>
            <Field label="Follow-up Date"><input type="date" className={inputCls} value={f.follow_up_date} onChange={(e) => setF({ ...f, follow_up_date: e.target.value })} /></Field>
            <Field label="Follow-up Status">
              <select className={inputCls} value={f.follow_up_status} onChange={(e) => setF({ ...f, follow_up_status: e.target.value })}>
                <option value="pending">Pending</option><option value="completed">Completed</option><option value="overdue">Overdue</option>
              </select>
            </Field>
          </>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-muted">Cancel</button>
        <button onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">
          <CheckCircle2 className="size-4" /> Save Changes
        </button>
      </div>
    </Modal>
  );
}

function DetailsDialog({ appt, onClose }: { appt: Appt; onClose: () => void }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  useEffect(() => {
    if (appt.patient_id) queryOne<Patient>("SELECT * FROM patients WHERE id=?", [appt.patient_id]).then(setPatient);
  }, [appt.patient_id]);

  return (
    <Modal onClose={onClose} title={<><CalendarCheck className="size-5 text-primary" /> Appointment #{appt.id}</>}>
      <div className="space-y-3 text-sm">
        <Section title="Patient">
          <Row k="Name" v={appt.patient_name ?? "—"} />
          <Row k="Phone" v={appt.patient_phone ?? "—"} />
          <Row k="Email" v={patient?.email ?? "—"} />
          <Row k="WhatsApp" v={patient?.whatsapp ?? "—"} />
          <Row k="Gender / Age" v={`${patient?.gender ?? "—"} / ${patient?.age ?? "—"}`} />
        </Section>
        <Section title="Doctor">
          <Row k="Doctor" v={appt.doctor_name ?? "—"} />
          <Row k="Department" v={appt.department ?? "—"} />
        </Section>
        <Section title="Schedule">
          <Row k="Date" v={appt.scheduled_at.slice(0, 10)} />
          <Row k="Time" v={appt.scheduled_time ?? "—"} />
          <Row k="Type" v={appt.type ?? "—"} />
          <Row k="Reason" v={appt.reason ?? "—"} />
          <Row k="Status" v={appt.status} />
          {appt.is_follow_up === 1 && (
            <>
              <Row k="Follow-up Date" v={appt.follow_up_date ?? "—"} />
              <Row k="Follow-up Status" v={appt.follow_up_status ?? "—"} />
            </>
          )}
        </Section>
      </div>
      <div className="mt-5 flex justify-end">
        <button onClick={onClose} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">Close</button>
      </div>
    </Modal>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="mb-2 text-[11px] font-bold tracking-wider text-muted-foreground">{title.toUpperCase()}</div>
      {children}
    </div>
  );
}

/* ============== Generic Modal / Field ============== */
function Modal({ title, children, onClose }: { title: React.ReactNode; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-card p-5 shadow-xl">
        <div className="flex items-center justify-between pb-4">
          <h3 className="inline-flex items-center gap-2 text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted"><X className="size-4" /></button>
        </div>
        {children}
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
