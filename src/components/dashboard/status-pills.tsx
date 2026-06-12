type Tone = "blue" | "purple" | "green" | "red" | "yellow" | "cyan" | "mint";

const toneMap: Record<Tone, { bg: string; fg: string }> = {
  blue:   { bg: "bg-status-blue",   fg: "text-status-blue-fg" },
  purple: { bg: "bg-status-purple", fg: "text-status-purple-fg" },
  green:  { bg: "bg-status-green",  fg: "text-status-green-fg" },
  red:    { bg: "bg-status-red",    fg: "text-status-red-fg" },
  yellow: { bg: "bg-status-yellow", fg: "text-status-yellow-fg" },
  cyan:   { bg: "bg-status-cyan",   fg: "text-status-cyan-fg" },
  mint:   { bg: "bg-status-mint",   fg: "text-status-mint-fg" },
};

function Pill({ tone, label, value }: { tone: Tone; label: string; value: number }) {
  const t = toneMap[tone];
  return (
    <div className={`rounded-xl ${t.bg} px-4 py-3`}>
      <div className={`text-[11px] font-bold tracking-wider ${t.fg}`}>{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${t.fg}`}>{value}</div>
    </div>
  );
}

export function StatusPills({ data }: {
  data: {
    scheduled: number; confirmed: number; completed: number; cancelled: number;
    pendingBills: number; activePlans: number; plansDone: number;
  };
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      <Pill tone="blue"   label="SCHEDULED"     value={data.scheduled} />
      <Pill tone="purple" label="CONFIRMED"     value={data.confirmed} />
      <Pill tone="green"  label="COMPLETED"     value={data.completed} />
      <Pill tone="red"    label="CANCELLED"     value={data.cancelled} />
      <Pill tone="yellow" label="PENDING BILLS" value={data.pendingBills} />
      <Pill tone="cyan"   label="ACTIVE PLANS"  value={data.activePlans} />
      <Pill tone="mint"   label="PLANS DONE"    value={data.plansDone} />
    </div>
  );
}
