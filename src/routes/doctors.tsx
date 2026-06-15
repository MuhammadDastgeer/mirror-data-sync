import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Stethoscope, BarChart3, Filter, Search, Download, Send, Plus, ArrowLeft,
  UserRound, CheckCircle2, Send as SendIcon, Building2, CalendarCheck, IndianRupee,
  Activity, Users, ChevronRight, Pencil, Trash2, Eye, X, User, Briefcase, DollarSign,
  Stethoscope as StethIcon,
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
  password: string | null;
  phone: string | null;
  gender: string | null;
  dob: string | null;
  blood_group: string | null;
  address: string | null;
  qualification: string | null;
  experience_years: number | null;
  registration_no: string | null;
  license_no: string | null;
  fee: number;
  follow_up_fee: number;
  available_to_book: number;
  portal_sent: number;
  active: number;
  on_duty: number;
  created_at: string;
};

type Mode = { kind: "list" } | { kind: "form"; editing?: Doctor };

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
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [viewing, setViewing] = useState<Doctor | null>(null);

  useEffect(() => {
    queryAll<Doctor>("SELECT * FROM doctors ORDER BY id DESC").then(setRows).catch(() => setRows([]));
  }, [tick]);
  const refresh = () => setTick((t) => t + 1);

  if (mode.kind === "form") {
    return (
      <DoctorForm
        initial={mode.editing}
        onCancel={() => setMode({ kind: "list" })}
        onSaved={() => { setMode({ kind: "list" }); refresh(); }}
      />
    );
  }

  return (
    <div className="space-y-5">
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
          onAdd={() => setMode({ kind: "form" })}
          onView={(d) => setViewing(d)}
          onEdit={(d) => setMode({ kind: "form", editing: d })}
          onDelete={async (id) => {
            if (!confirm("Delete this doctor?")) return;
            await exec("DELETE FROM doctors WHERE id=?", [id]);
            refresh();
          }}
        />
      ) : (
        <OverviewTab rows={rows} onAdd={() => setMode({ kind: "form" })} onGoDoctors={() => setTab("doctors")} />
      )}

      {viewing ? <ViewDialog doctor={viewing} onClose={() => setViewing(null)} /> : null}
    </div>
  );
}

/* ============ DOCTORS TAB (LIST) ============ */
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
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Fee</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr
                    key={d.id}
                    className="border-t border-border hover:bg-muted/40 cursor-pointer"
                    onClick={() => onView(d)}
                  >
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.specialty ?? "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.department ?? "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.email ?? "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.phone ?? "-"}</td>
                    <td className="px-4 py-3">₹{d.fee.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        d.active ? "bg-status-green/50 text-status-green-fg" : "bg-status-red/50 text-status-red-fg"
                      }`}>
                        {d.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
  const navigate = useNavigate();
  const goAppointments = () => navigate({ to: "/appointments" });
  const goStaff = () => { window.location.href = "/staff"; };
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
            <button onClick={goAppointments} className="inline-flex items-center gap-2 rounded-lg border border-accent bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90">
              <CalendarCheck className="size-4" /> Appointments
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard tint="purple" icon={<UserRound className="size-5" />} value={total} label="Total Doctors" />
        <KpiCard tint="teal" icon={<Users className="size-5" />} value={active} label="Active Doctors" />
        <KpiCard tint="green" icon={<CheckCircle2 className="size-5" />} value={available} label="Available to Book" />
        <KpiCard tint="orange" icon={<SendIcon className="size-5" />} value={portal} label="Portal Access Sent" />
      </div>

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
            <button onClick={onGoDoctors} className="rounded-lg border border-status-purple bg-status-purple/40 px-3 py-1 text-xs font-semibold text-status-purple-fg">
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

      <section className="rounded-2xl bg-card border border-border shadow-sm">
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-bold">Doctors on Duty Today</h3>
            <p className="text-xs text-muted-foreground">{onDuty.length} doctors with scheduled appointments</p>
          </div>
          <button onClick={goAppointments} className="rounded-lg border border-status-cyan bg-status-cyan/40 px-3 py-1 text-xs font-semibold text-status-cyan-fg">
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
          onClick={goStaff}
        />
        <ActionCard
          gradient="from-status-mint-fg to-status-mint-fg/70"
          icon={<CalendarCheck className="size-5" />}
          title="View Appointments"
          desc="Check today's appointments and doctor schedules"
          cta="Appointments"
          onClick={goAppointments}
        />
      </div>
    </div>
  );
}

/* ============ FULL-PAGE FORM ============ */
const DEPARTMENTS = [
  "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Gynecology",
  "Dermatology", "ENT", "Ophthalmology", "Psychiatry", "Radiology",
  "Oncology", "General Medicine", "General Surgery", "Urology", "Dental",
];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function DoctorForm({
  initial, onCancel, onSaved,
}: { initial?: Doctor; onCancel: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [gender, setGender] = useState(initial?.gender ?? "");
  const [dob, setDob] = useState(initial?.dob ?? "");
  const [bloodGroup, setBloodGroup] = useState(initial?.blood_group ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");

  const [specialty, setSpecialty] = useState(initial?.specialty ?? "");
  const [qualification, setQualification] = useState(initial?.qualification ?? "");
  const [experience, setExperience] = useState<number | "">(initial?.experience_years ?? 0);
  const [registrationNo, setRegistrationNo] = useState(initial?.registration_no ?? "");
  const [licenseNo, setLicenseNo] = useState(initial?.license_no ?? "");

  const [department, setDepartment] = useState(initial?.department ?? "");
  const [fee, setFee] = useState<number | "">(initial?.fee ?? 0);
  const [followUpFee, setFollowUpFee] = useState<number | "">(initial?.follow_up_fee ?? "");

  const [active, setActive] = useState(initial ? !!initial.active : true);
  const [available, setAvailable] = useState(initial ? !!initial.available_to_book : true);

  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return alert("Full name is required");
    if (!email.trim()) return alert("Email is required");
    if (!initial && !password.trim()) return alert("Password is required");
    if (fee === "" || Number(fee) < 0) return alert("Consultation fee is required");
    setSaving(true);
    try {
      if (initial) {
        await exec(
          `UPDATE doctors SET name=?, email=?, password=?, phone=?, gender=?, dob=?, blood_group=?, address=?,
            specialty=?, qualification=?, experience_years=?, registration_no=?, license_no=?,
            department=?, fee=?, follow_up_fee=?, active=?, available_to_book=? WHERE id=?`,
          [name, email, password || initial.password, phone, gender, dob, bloodGroup, address,
            specialty, qualification, experience === "" ? null : experience, registrationNo, licenseNo,
            department, Number(fee) || 0, followUpFee === "" ? 0 : Number(followUpFee),
            active ? 1 : 0, available ? 1 : 0, initial.id],
        );
      } else {
        await exec(
          `INSERT INTO doctors (name, email, password, phone, gender, dob, blood_group, address,
            specialty, qualification, experience_years, registration_no, license_no,
            department, fee, follow_up_fee, active, available_to_book)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, email, password, phone, gender, dob, bloodGroup, address,
            specialty, qualification, experience === "" ? null : experience, registrationNo, licenseNo,
            department, Number(fee) || 0, followUpFee === "" ? 0 : Number(followUpFee),
            active ? 1 : 0, available ? 1 : 0],
        );
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted"
        >
          <ArrowLeft className="size-4" /> Back to Doctors
        </button>
        <div>
          <h1 className="text-2xl font-bold">{initial ? "Edit Doctor" : "Add New Doctor"}</h1>
          <p className="text-sm text-muted-foreground">Fill in all required information below</p>
        </div>
      </div>

      {/* Basic Information */}
      <Section
        iconBg="bg-accent text-accent-foreground"
        icon={<User className="size-4" />}
        title="Basic Information"
      >
        <Grid2>
          <Field label="FULL NAME" required>
            <input className={inp} placeholder="Dr. John Smith" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="EMAIL ADDRESS" required>
            <input type="email" className={inp} placeholder="doctor@hospital.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="PASSWORD" required={!initial}>
            <input
              type="password"
              className={inp}
              placeholder={initial ? "Leave blank to keep current" : "Set a login password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label="PHONE NUMBER">
            <input className={inp} placeholder="+91 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="GENDER">
            <select className={inp} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="DATE OF BIRTH">
            <input type="date" className={inp} value={dob} onChange={(e) => setDob(e.target.value)} />
          </Field>
          <Field label="BLOOD GROUP">
            <select className={inp} value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
              <option value="">Select...</option>
              {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </Field>
        </Grid2>
        <Field label="ADDRESS">
          <textarea
            rows={3}
            className={inp}
            placeholder="Full address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Field>
      </Section>

      {/* Professional Information */}
      <Section
        iconBg="bg-status-purple/60 text-status-purple-fg"
        icon={<Briefcase className="size-4" />}
        title="Professional Information"
      >
        <Grid2>
          <Field label="SPECIALIZATION">
            <input className={inp} placeholder="e.g. Cardiology, Ortho" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
          </Field>
          <Field label="QUALIFICATION">
            <input className={inp} placeholder="e.g. MBBS, MD, MS" value={qualification} onChange={(e) => setQualification(e.target.value)} />
          </Field>
          <Field label="EXPERIENCE (YEARS)">
            <input
              type="number" min={0}
              className={inp}
              value={experience}
              onChange={(e) => setExperience(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </Field>
          <Field label="MEDICAL REGISTRATION NO.">
            <input className={inp} placeholder="e.g. MCI-12345" value={registrationNo} onChange={(e) => setRegistrationNo(e.target.value)} />
          </Field>
          <Field label="LICENSE NUMBER">
            <input className={inp} placeholder="e.g. LIC-67890" value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} />
          </Field>
        </Grid2>
      </Section>

      {/* Department & Fees */}
      <Section
        iconBg="bg-status-green/60 text-status-green-fg"
        icon={<DollarSign className="size-4" />}
        title="Department & Fees"
      >
        <Field label="DEPARTMENT">
          <select className={inp} value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">— Select Department —</option>
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Grid2>
          <Field label="CONSULTATION FEE (₹)" required>
            <input
              type="number" min={0}
              className={inp}
              value={fee}
              onChange={(e) => setFee(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </Field>
          <Field label="FOLLOW-UP FEE (₹)">
            <input
              type="number" min={0}
              className={inp}
              placeholder="300"
              value={followUpFee}
              onChange={(e) => setFollowUpFee(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </Field>
        </Grid2>
      </Section>

      {/* Status Settings */}
      <Section
        iconBg="bg-status-red/60 text-status-red-fg"
        icon={<StethIcon className="size-4" />}
        title="Status Settings"
      >
        <ToggleRow
          title="Active Status"
          desc="Doctor can accept and manage appointments"
          checked={active}
          onChange={setActive}
        />
        <ToggleRow
          title="Available for Booking"
          desc="Show in available list for new bookings"
          checked={available}
          onChange={setAvailable}
        />
      </Section>

      {/* Footer actions */}
      <div className="sticky bottom-0 -mx-6 flex items-center justify-end gap-2 border-t border-border bg-card px-6 py-3">
        <button
          onClick={onCancel}
          className="rounded-lg border border-border bg-background px-5 py-2 text-sm font-semibold hover:bg-muted"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving..." : initial ? "Save Changes" : "Add Doctor"}
        </button>
      </div>
    </div>
  );
}

/* ============ Form helpers ============ */
function Section({
  icon, iconBg, title, children,
}: { icon: React.ReactNode; iconBg: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <header className="flex items-center gap-3 border-b border-border bg-muted/40 px-5 py-3">
        <div className={`grid size-8 place-items-center rounded-lg ${iconBg}`}>{icon}</div>
        <h3 className="text-base font-bold">{title}</h3>
      </header>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}
function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>;
}
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold tracking-wider text-muted-foreground">
        {label}{required ? <span className="text-status-red-fg"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
function ToggleRow({
  title, desc, checked, onChange,
}: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
      <div>
        <div className="text-sm font-bold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
const inp = "w-full rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:bg-background";

/* ============ small UI bits (Overview) ============ */
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

/* ============ View dialog ============ */
function ViewDialog({ doctor, onClose }: { doctor: Doctor; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-card shadow-xl border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-base font-bold">{doctor.name}</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted"><X className="size-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-5 text-sm">
          <Info k="Email" v={doctor.email} />
          <Info k="Phone" v={doctor.phone} />
          <Info k="Gender" v={doctor.gender} />
          <Info k="Date of Birth" v={doctor.dob} />
          <Info k="Blood Group" v={doctor.blood_group} />
          <Info k="Address" v={doctor.address} />
          <Info k="Specialization" v={doctor.specialty} />
          <Info k="Qualification" v={doctor.qualification} />
          <Info k="Experience" v={doctor.experience_years ? `${doctor.experience_years} yrs` : null} />
          <Info k="Registration No." v={doctor.registration_no} />
          <Info k="License No." v={doctor.license_no} />
          <Info k="Department" v={doctor.department} />
          <Info k="Consultation Fee" v={`₹${doctor.fee.toLocaleString()}`} />
          <Info k="Follow-up Fee" v={`₹${doctor.follow_up_fee.toLocaleString()}`} />
          <Info k="Status" v={doctor.active ? "Active" : "Inactive"} />
          <Info k="Available to Book" v={doctor.available_to_book ? "Yes" : "No"} />
        </div>
      </div>
    </div>
  );
}
function Info({ k, v }: { k: string; v: string | number | null }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{k}</div>
      <div className="font-medium break-words">{v || "-"}</div>
    </div>
  );
}
