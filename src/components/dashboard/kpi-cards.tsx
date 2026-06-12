import { Users, UserRound, CalendarDays, IndianRupee, type LucideIcon } from "lucide-react";

type Tone = "teal" | "green" | "purple" | "orange";

const tones: Record<Tone, { bg: string; iconBg: string; iconFg: string }> = {
  teal:   { bg: "bg-kpi-teal",   iconBg: "bg-kpi-teal-fg/15",   iconFg: "text-kpi-teal-fg" },
  green:  { bg: "bg-kpi-green",  iconBg: "bg-kpi-green-fg/15",  iconFg: "text-kpi-green-fg" },
  purple: { bg: "bg-kpi-purple", iconBg: "bg-kpi-purple-fg/15", iconFg: "text-kpi-purple-fg" },
  orange: { bg: "bg-kpi-orange", iconBg: "bg-kpi-orange-fg/15", iconFg: "text-kpi-orange-fg" },
};

function Card({
  tone, icon: Icon, label, value, sub,
}: { tone: Tone; icon: LucideIcon; label: string; value: string; sub: string }) {
  const t = tones[tone];
  return (
    <div className={`rounded-xl ${t.bg} p-4 flex items-start gap-4`}>
      <div className={`grid size-12 place-items-center rounded-xl ${t.iconBg} ${t.iconFg}`}>
        <Icon className="size-6" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground/70">{label}</div>
        <div className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">{value}</div>
        <div className="mt-1 text-xs text-foreground/60">{sub}</div>
      </div>
    </div>
  );
}

export function KpiCards({
  doctors, patients, todayAppts, todayCompleted, patientsThisMonth, revenueToday, revenueThisMonth,
}: {
  doctors: number;
  patients: number;
  todayAppts: number;
  todayCompleted: number;
  patientsThisMonth: number;
  revenueToday: number;
  revenueThisMonth: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card tone="teal"   icon={Users}        label="Staff & Doctors"     value={String(doctors)}  sub={`${doctors} active doctors`} />
      <Card tone="green"  icon={UserRound}    label="Total Patients"      value={String(patients)} sub={`+${patientsThisMonth} this month`} />
      <Card tone="purple" icon={CalendarDays} label="Today Appointments"  value={String(todayAppts)} sub={`${todayCompleted} completed`} />
      <Card tone="orange" icon={IndianRupee}  label="Revenue Today"       value={`₹${revenueToday}`} sub={`₹${revenueThisMonth} this month`} />
    </div>
  );
}
