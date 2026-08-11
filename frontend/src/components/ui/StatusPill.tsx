const STYLES: Record<string, string> = {
  DRAFT: "bg-amber-bg text-amber border-amber/30",
  CONFIRMED: "bg-teal-bg text-teal border-teal/30",
  CANCELLED: "bg-rose-bg text-rose border-rose/30",
  LEAD: "bg-slate-bg text-slate border-slate/30",
  ACTIVE: "bg-teal-bg text-teal border-teal/30",
  INACTIVE: "bg-rose-bg text-rose border-rose/30",
  IN: "bg-teal-bg text-teal border-teal/30",
  OUT: "bg-amber-bg text-amber border-amber/30",
};

export function StatusPill({ status }: { status: string }) {
  const style = STYLES[status] ?? "bg-slate-bg text-slate border-slate/30";
  return <span className={`stamp ${style}`}>{status}</span>;
}
