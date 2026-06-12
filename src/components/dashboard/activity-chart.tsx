import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export function ActivityChart({ data }: {
  data: { month: string; appointments: number; newPatients: number }[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold">Monthly Activity Trends</h3>
          <p className="text-xs text-muted-foreground">Appointments & new patients · last 9 months</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-primary" /> Appointments
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm" style={{ background: "oklch(0.65 0.16 155)" }} /> New Patients
          </span>
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="oklch(0.92 0.01 256)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "oklch(0.5 0.03 256)" }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "oklch(0.5 0.03 256)" }} domain={[0, 4]} ticks={[0,1,2,3,4]} />
            <Tooltip />
            <Line type="monotone" dataKey="appointments" stroke="oklch(0.62 0.12 180)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="newPatients" stroke="oklch(0.65 0.16 155)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
