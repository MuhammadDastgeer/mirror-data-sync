import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Stethoscope, BarChart3, Filter, Search, Download, Send, Plus, X,
  UserRound, CheckCircle2, BookOpen, Send as SendIcon, Building2,
  CalendarCheck, IndianRupee, Activity, Users, ChevronRight, Pencil, Trash2, Eye,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { exec, queryAll } from "@/lib/db";

export const Route = createFileRoute("/doctors")({
  head: () => ({
    meta: [
      { title: "Doctors · Code Hospital Admin" },
      { name: "description", content: "Manage doctor profiles, schedules and credentials." },
    ],
  }),
  component: DoctorsPage,
});

type Doctor = {
  id: number;
  name: string;
  specialty: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  qualification: string | null;
  experience_years: number | null;
  fee: number;
  available_to_book: number;
  portal_sent: number;
  active: number;
  on_duty: number;
  created_at: string;
};

function DoctorsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
          {mounted ? <DoctorsInner /> : null}
        </main>
      </div>
    </div>
  );
}

function DoctorsInner() {
  const [tab, setTab] = useState<"doctors" | "overview">("doctors");
  const [rows, setRows] = useState<Doctor[]>([]);
  const [tick, setTick] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [viewing, setViewing] = useState<Doctor | null>(null);

  useEffect(() => {
    queryAll<Doctor>("SELECT * FROM doctors ORDER BY id DESC").then(setRows).catch(() => setRows([]));
  }, [tick]);
  const refresh = () => setTick((t) => t + 1);

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="inline-flex items-center gap-2 rounded-xl bg-card p-1 shadow-sm border border-border">
        <button
          onClick={() => setTab("doctors")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "doctors" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Stethoscope className="size-4" /> Doctors
        </button>
        <button
          onClick={() => setTab("overview")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "overview" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <BarChart3 className="size-4" /> Overview
        </button>
      </div>

      {tab === "doctors" ? (
        <DoctorsTab
          rows={rows}
          onAdd={() => setShowAdd(true)}
          onView={(d) => setViewing(d)}
          onEdit={(d) => setEditing(d)}
          onDelete={async (id) => {
            if (!confirm("Delete this doctor?")) return;
            await exec("DELETE FROM doctors WHERE id=?", [id]);
            refresh();
          }}
        />
      ) : (
        <OverviewTab rows={rows} onAdd={() => setShowAdd(true)} onGoDoctors={() => setTab("doctors")} />
      )}

      {showAdd ? <DoctorDialog onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); refresh(); }} /> : null}
      {editing ? <DoctorDialog initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} /> : null}
      {viewing ? <ViewDialog doctor={viewing} onClose={() => setViewing(null)} /> : null}
    </div>
  );
}

/* ============ DOCTORS TAB ============ */
function DoctorsTab({
  rows, onAdd, onView, onEdit, onDelete,
}: {
  rows: Doctor[];
  onAdd: () => void;
  onView: (d: Doctor) => void;
  onEdit: (d: Doctor) => void;
  onDelete: (id: number) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((d) =>
      [d.name, d.specialty, d.department, d.email, d.phone].some((v) => (v ?? "").toLowerCase().includes(s)),
    );
  }, [q, rows]);

  return (
    <section className="rounded-2xl bg-card border border-border shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-xl font-bold text-foreground">Doctors</h2>
          <p className="text-xs text-muted-foreground">Manage doctor profiles, schedules and credentials</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
            <Filter className="size-4" /> Filters
          </button>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search doctors..."
              className="w-56 rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
            <Download className="size-4" /> Export
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-status-blue bg-status-blue/40 px-3 py-2 text-sm font-semibold text-status-blue-fg hover:bg-status-blue/60">
            <Send className="size-4" /> Send All
          </button>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" /> Add Doctor
          </button>
        </div>
      </header>

      <div className="p-4">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background py-16 text-center text-sm text-muted-foreground">
            No doctors found. Click "+ Add Doctor" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Specialty</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Fee</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.specialty ?? "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.department ?? "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.phone ?? "-"}</td>
                    <td className="px-4 py-3">₹{d.fee.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        d.active ? "bg-status-green/50 text-status-green-fg" : "bg-status-red/50 text-status-red-fg"
                      }`}>
                        {d.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onView(d)} className="rounded-md p-1.5 hover:bg-muted" title="View">
                          <Eye className="size-4" />
                        </button>
                        <button onClick={() => onEdit(d)} className="rounded-md p-1.5 hover:bg-muted" title="Edit">
                          <Pencil className="size-4" />
                        </button>
                        <button onClick={() => onDelete(d.id)} className="rounded-md p-1.5 text-status-red-fg hover:bg-status-red/40" title="Delete">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

/* ============ OVERVIEW TAB ============ */
function OverviewTab({ rows, onAdd, onGoDoctors }: { rows: Doctor[]; onAdd: () => void; onGoDoctors: () => void }) {
  const total = rows.length;
  const active = rows.filter((r) => r.active).length;
  const available = rows.filter((r) => r.available_to_book).length;
  const portal = rows.filter((r) => r.portal_sent).length;

  const fees = rows.filter((r) => r.active).map((r) => r.fee);
  const avgFee = fees.length ? Math.round(fees.reduce((a, b) => a + b, 0) / fees.length) : 0;
  const lowFee = fees.length ? Math.min(...fees) : 0;
  const highFee = fees.length ? Math.max(...fees) : 0;

  const byDept = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const k = r.department ?? "Unassigned";
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries());
  }, [rows]);

  const recent = rows.slice(0, 5);
  const onDuty = rows.filter((r) => r.on_duty);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Summary of doctor distribution, department breakdown, on-duty stats, and recent additions
      </p>

      {/* Doctors Overview header card */}
      <section className="rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Stethoscope className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Doctors Overview</h3>
              <p className="text-xs text-muted-foreground">
                {total} registered · {active} active · {available} available for booking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onGoDoctors}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <Users className="size-4" /> Manage Doctors
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-accent bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90">
              <CalendarCheck className="size-4" /> Appointments
            </button>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard tint="purple" icon={<UserRound className="size-5" />} value={total} label="Total Doctors" />
        <KpiCard tint="teal" icon={<Users className="size-5" />} value={active} label="Active Doctors" />
        <KpiCard tint="green" icon={<CheckCircle2 className="size-5" />} value={available} label="Available to Book" />
        <KpiCard tint="orange" icon={<SendIcon className="size-5" />} value={portal} label="Portal Access Sent" />
      </div>

      {/* By department + recently added */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl bg-card border border-border shadow-sm">
          <header className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="text-sm font-bold">Doctors by Department</h3>
              <p className="text-xs text-muted-foreground">Distribution across all departments</p>
            </div>
            <div className="grid size-8 place-items-center rounded-lg bg-kpi-purple text-kpi-purple-fg">
              <Building2 className="size-4" />
            </div>
          </header>
          <div className="p-5">
            {byDept.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No department data available</p>
            ) : (
              <ul className="space-y-2">
                {byDept.map(([dept, count]) => (
                  <li key={dept} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                    <span className="font-medium">{dept}</span>
                    <span className="text-muted-foreground">{count} doctor{count > 1 ? "s" : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-card border border-border shadow-sm">
          <header className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="text-sm font-bold">Recently Added</h3>
              <p className="text-xs text-muted-foreground">Latest doctors onboarded</p>
            </div>
            <button className="rounded-lg border border-status-purple bg-status-purple/40 px-3 py-1 text-xs font-semibold text-status-purple-fg">
              View All
            </button>
          </header>
          <div className="p-5">
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <UserRound className="size-8 mb-2 opacity-50" />
                <p className="text-sm">No doctors yet</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {recent.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                    <div className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground text-xs font-bold">
                      {d.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{d.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{d.specialty ?? "-"}</div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Doctors on duty today */}
      <section className="rounded-2xl bg-card border border-border shadow-sm">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-bold">Doctors on Duty Today</h3>
            <p className="text-xs text-muted-foreground">{onDuty.length} doctors with scheduled appointments</p>
          </div>
          <button className="rounded-lg border border-status-cyan bg-status-cyan/40 px-3 py-1 text-xs font-semibold text-status-cyan-fg">
            View Appointments
          </button>
        </header>
        <div className="p-5">
          {onDuty.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Stethoscope className="size-8 mb-2 opacity-50" />
              <p className="text-sm">No doctors have appointments scheduled today</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {onDuty.map((d) => (
                <li key={d.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.specialty ?? "-"}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Fee Structure Overview */}
      <section className="rounded-2xl bg-card border border-border shadow-sm">
        <header className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold">Fee Structure Overview</h3>
          <p className="text-xs text-muted-foreground">Consultation fees across active doctors</p>
        </header>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <FeeCard tint="purple" icon={<IndianRupee className="size-5" />} value={avgFee} label="Avg. Consultation Fee" />
          <FeeCard tint="green" icon={<Activity className="size-5" />} value={lowFee} label="Lowest Fee" />
          <FeeCard tint="orange" icon={<IndianRupee className="size-5" />} value={highFee} label="Highest Fee" />
        </div>
      </section>

      {/* Action cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ActionCard
          gradient="from-status-purple-fg to-status-purple-fg/70"
          icon={<Stethoscope className="size-5" />}
          title="Add New Doctor"
          desc="Register a new doctor with full profile and credentials"
          cta="Add Doctor"
          onClick={onAdd}
        />
        <ActionCard
          gradient="from-primary to-primary/70"
          icon={<Users className="size-5" />}
          title="Manage Staff"
          desc="View and manage all non-doctor hospital staff members"
          cta="Go to Staff"
          onClick={() => {}}
        />
        <ActionCard
          gradient="from-status-mint-fg to-status-mint-fg/70"
          icon={<CalendarCheck className="size-5" />}
          title="View Appointments"
          desc="Check today's appointments and doctor schedules"
          cta="Appointments"
          onClick={() => {}}
        />
      </div>
    </div>
  );
}

/* ============ small UI bits ============ */
function KpiCard({
  tint, icon, value, label,
}: { tint: "purple" | "teal" | "green" | "orange"; icon: React.ReactNode; value: number | string; label: string }) {
  const bg = { purple: "bg-kpi-purple", teal: "bg-kpi-teal", green: "bg-kpi-green", orange: "bg-kpi-orange" }[tint];
  const fg = { purple: "text-kpi-purple-fg", teal: "text-kpi-teal-fg", green: "text-kpi-green-fg", orange: "text-kpi-orange-fg" }[tint];
  const iconBg = { purple: "bg-status-purple-fg", teal: "bg-primary", green: "bg-status-green-fg", orange: "bg-kpi-orange-fg" }[tint];
  return (
    <div className={`flex items-center gap-4 rounded-2xl border border-border ${bg} p-4`}>
      <div className={`grid size-11 place-items-center rounded-xl text-white ${iconBg}`}>{icon}</div>
      <div>
        <div className={`text-2xl font-bold ${fg}`}>{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function FeeCard({
  tint, icon, value, label,
}: { tint: "purple" | "green" | "orange"; icon: React.ReactNode; value: number; label: string }) {
  const bg = { purple: "bg-kpi-purple", green: "bg-kpi-green", orange: "bg-kpi-orange" }[tint];
  const fg = { purple: "text-kpi-purple-fg", green: "text-kpi-green-fg", orange: "text-kpi-orange-fg" }[tint];
  return (
    <div className={`flex items-center gap-3 rounded-xl border border-border ${bg} px-4 py-3`}>
      <div className={`grid size-9 place-items-center rounded-lg bg-background ${fg}`}>{icon}</div>
      <div>
        <div className={`text-xl font-bold ${fg}`}>₹{value.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function ActionCard({
  gradient, icon, title, desc, cta, onClick,
}: { gradient: string; icon: React.ReactNode; title: string; desc: string; cta: string; onClick: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className={`bg-gradient-to-br ${gradient} p-5 text-white`}>
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-white/20">{icon}</div>
          <div>
            <div className="text-base font-bold">{title}</div>
            <div className="text-xs opacity-90">{desc}</div>
          </div>
        </div>
      </div>
      <div className="p-3">
        <button
          onClick={onClick}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
        >
          {cta} <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* ============ Dialogs ============ */
function DoctorDialog({
  initial, onClose, onSaved,
}: { initial?: Doctor; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [specialty, setSpecialty] = useState(initial?.specialty ?? "");
  const [department, setDepartment] = useState(initial?.department ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [qualification, setQualification] = useState(initial?.qualification ?? "");
  const [experience, setExperience] = useState<number | "">(initial?.experience_years ?? "");
  const [fee, setFee] = useState<number | "">(initial?.fee ?? "");
  const [available, setAvailable] = useState(initial ? !!initial.available_to_book : true);
  const [active, setActive] = useState(initial ? !!initial.active : true);
  const [onDuty, setOnDuty] = useState(initial ? !!initial.on_duty : false);

  const save = async () => {
    if (!name.trim()) return alert("Name is required");
    if (initial) {
      await exec(
        `UPDATE doctors SET name=?, specialty=?, department=?, email=?, phone=?, qualification=?,
          experience_years=?, fee=?, available_to_book=?, active=?, on_duty=? WHERE id=?`,
        [name, specialty, department, email, phone, qualification,
          experience === "" ? null : experience, fee === "" ? 0 : fee,
          available ? 1 : 0, active ? 1 : 0, onDuty ? 1 : 0, initial.id],
      );
    } else {
      await exec(
        `INSERT INTO doctors (name, specialty, department, email, phone, qualification, experience_years, fee, available_to_book, active, on_duty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, specialty, department, email, phone, qualification,
          experience === "" ? null : experience, fee === "" ? 0 : fee,
          available ? 1 : 0, active ? 1 : 0, onDuty ? 1 : 0],
      );
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-card shadow-xl border border-border">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-base font-bold">{initial ? "Edit Doctor" : "Add Doctor"}</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted"><X className="size-4" /></button>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          <Field label="Name *"><input className={inp} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Specialty"><input className={inp} value={specialty} onChange={(e) => setSpecialty(e.target.value)} /></Field>
          <Field label="Department"><input className={inp} value={department} onChange={(e) => setDepartment(e.target.value)} /></Field>
          <Field label="Qualification"><input className={inp} value={qualification} onChange={(e) => setQualification(e.target.value)} /></Field>
          <Field label="Email"><input className={inp} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Phone"><input className={inp} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label="Experience (years)">
            <input type="number" className={inp} value={experience} onChange={(e) => setExperience(e.target.value === "" ? "" : Number(e.target.value))} />
          </Field>
          <Field label="Consultation Fee (₹)">
            <input type="number" className={inp} value={fee} onChange={(e) => setFee(e.target.value === "" ? "" : Number(e.target.value))} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} /> Available to Book
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onDuty} onChange={(e) => setOnDuty(e.target.checked)} /> On Duty Today
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
          <button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {initial ? "Save Changes" : "Add Doctor"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewDialog({ doctor, onClose }: { doctor: Doctor; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-card shadow-xl border border-border">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-base font-bold">{doctor.name}</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted"><X className="size-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-5 text-sm">
          <Info k="Specialty" v={doctor.specialty} />
          <Info k="Department" v={doctor.department} />
          <Info k="Email" v={doctor.email} />
          <Info k="Phone" v={doctor.phone} />
          <Info k="Qualification" v={doctor.qualification} />
          <Info k="Experience" v={doctor.experience_years ? `${doctor.experience_years} yrs` : null} />
          <Info k="Fee" v={`₹${doctor.fee.toLocaleString()}`} />
          <Info k="Status" v={doctor.active ? "Active" : "Inactive"} />
          <Info k="Available to Book" v={doctor.available_to_book ? "Yes" : "No"} />
          <Info k="On Duty Today" v={doctor.on_duty ? "Yes" : "No"} />
        </div>
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
function Info({ k, v }: { k: string; v: string | number | null }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="font-medium">{v ?? "-"}</div>
    </div>
  );
}
