import { useEffect, useState } from "react";
import { queryAll, queryOne } from "@/lib/db";

export type DashboardData = {
  doctors: number;
  patients: number;
  patientsThisMonth: number;
  todayAppts: number;
  todayCompleted: number;
  revenueToday: number;
  revenueThisMonth: number;
  status: {
    scheduled: number; confirmed: number; completed: number; cancelled: number;
    pendingBills: number; activePlans: number; plansDone: number;
  };
  monthly: { month: string; appointments: number; newPatients: number }[];
  recentPatients: { id: number; name: string; phone: string | null; created_at: string }[];
  registeredToday: number;
  doctorsOnDuty: number;
  alerts: { id: number; message: string; severity: string }[];
  summary: { followUps: number; newPatients: number; revenue: number; lowStock: number };
  lastUpdated: string;
};

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const n = async (sql: string, params: unknown[] = []) =>
        ((await queryOne<{ c: number }>(sql, params))?.c ?? 0);

      const now = new Date();
      const ymStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const todayStr = now.toISOString().slice(0, 10);

      const [
        doctors, patients, patientsThisMonth,
        todayAppts, todayCompleted,
        revenueTodayRow, revenueMonthRow,
        scheduled, confirmed, completed, cancelled,
        pendingBills, activePlans, plansDone,
        registeredToday, doctorsOnDuty,
      ] = await Promise.all([
        n("SELECT COUNT(*) c FROM doctors WHERE active=1"),
        n("SELECT COUNT(*) c FROM patients"),
        n("SELECT COUNT(*) c FROM patients WHERE created_at>=?", [ymStart]),
        n("SELECT COUNT(*) c FROM appointments WHERE date(scheduled_at)=date('now')"),
        n("SELECT COUNT(*) c FROM appointments WHERE date(scheduled_at)=date('now') AND status='completed'"),
        queryOne<{ s: number }>("SELECT COALESCE(SUM(amount),0) s FROM bills WHERE status='paid' AND date(created_at)=date('now')"),
        queryOne<{ s: number }>("SELECT COALESCE(SUM(amount),0) s FROM bills WHERE status='paid' AND created_at>=?", [ymStart]),
        n("SELECT COUNT(*) c FROM appointments WHERE status='scheduled'"),
        n("SELECT COUNT(*) c FROM appointments WHERE status='confirmed'"),
        n("SELECT COUNT(*) c FROM appointments WHERE status='completed'"),
        n("SELECT COUNT(*) c FROM appointments WHERE status='cancelled'"),
        n("SELECT COUNT(*) c FROM bills WHERE status='pending'"),
        n("SELECT COUNT(*) c FROM treatment_plans WHERE status='active'"),
        n("SELECT COUNT(*) c FROM treatment_plans WHERE status='done'"),
        n("SELECT COUNT(*) c FROM patients WHERE date(created_at)=?", [todayStr]),
        n("SELECT COUNT(*) c FROM doctors WHERE on_duty=1 AND active=1"),
      ]);

      // Last 9 months trends
      const monthly: { month: string; appointments: number; newPatients: number }[] = [];
      for (let i = 8; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
        const endD = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const end = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, "0")}-01`;
        const appts = await n("SELECT COUNT(*) c FROM appointments WHERE created_at>=? AND created_at<?", [start, end]);
        const newP = await n("SELECT COUNT(*) c FROM patients WHERE created_at>=? AND created_at<?", [start, end]);
        monthly.push({ month: MONTH_LABELS[d.getMonth()], appointments: appts, newPatients: newP });
      }

      const recent = await queryAll<{ id: number; name: string; phone: string | null; created_at: string }>(
        "SELECT id, name, phone, created_at FROM patients ORDER BY id DESC LIMIT 5",
      );

      const alerts = await queryAll<{ id: number; message: string; severity: string }>(
        "SELECT id, message, severity FROM alerts ORDER BY id DESC LIMIT 5",
      );

      const followUps = await n("SELECT COUNT(*) c FROM appointments WHERE date(scheduled_at)=date('now') AND status='confirmed'");
      const lowStock = 0; // no inventory table yet on this screen

      if (cancelled) return;
      setData({
        doctors, patients, patientsThisMonth,
        todayAppts, todayCompleted,
        revenueToday: Math.round(revenueTodayRow?.s ?? 0),
        revenueThisMonth: Math.round(revenueMonthRow?.s ?? 0),
        status: { scheduled, confirmed, completed, cancelled, pendingBills, activePlans, plansDone },
        monthly,
        recentPatients: recent,
        registeredToday,
        doctorsOnDuty,
        alerts,
        summary: { followUps, newPatients: registeredToday, revenue: Math.round(revenueTodayRow?.s ?? 0), lowStock },
        lastUpdated: now.toLocaleTimeString("en-GB", { hour12: false }),
      });
    })().catch((e) => console.error("dashboard data error", e));
    return () => { cancelled = true; };
  }, [tick]);

  return { data, refresh: () => setTick((t) => t + 1) };
}
