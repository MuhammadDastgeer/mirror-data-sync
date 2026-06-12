import { Bell, ChevronDown, Search } from "lucide-react";

export function Topbar() {
  return (
    <header className="flex items-center gap-4 border-b border-border bg-background/60 px-6 py-3">
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-lg border border-input bg-card pl-9 pr-3 py-2 text-sm outline-none ring-0 focus:border-primary"
        />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button className="grid size-9 place-items-center rounded-lg border border-input bg-card text-muted-foreground hover:bg-muted">
          <Bell className="size-4" />
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-2 py-1.5">
          <div className="grid size-8 place-items-center rounded-md bg-brand text-brand-foreground text-xs font-bold">
            MH
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Muhammad</div>
            <div className="text-[11px] text-muted-foreground">Hosp. Admin</div>
          </div>
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
