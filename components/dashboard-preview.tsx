import { LogoMark } from "@/components/logo";

const NAV_ITEMS = ["Overview", "Properties", "Tenants", "Landlords", "Payments", "Maintenance", "Reports"];

const STATS = [
  { label: "RENT COLLECTED", value: "UGX 48.2M", note: "82% of September" },
  { label: "OCCUPANCY", value: "94%", note: "118 of 126 units" },
  { label: "OPEN REQUESTS", value: "7", note: "2 urgent", noteTone: "text-red-600" },
];

const PAYMENTS = [
  {
    initials: "AN",
    name: "Aisha Nansubuga",
    unit: "A4 · Kololo Heights",
    amount: "UGX 2,400,000",
    status: "Paid",
    avatar: "bg-ivy-100 text-ivy-800",
  },
  {
    initials: "DO",
    name: "Daniel Okello",
    unit: "B2 · Kira Gardens",
    amount: "UGX 1,200,000",
    status: "Paid",
    avatar: "bg-slate-200 text-slate-600",
  },
  {
    initials: "GA",
    name: "Grace Atim",
    unit: "C1 · Ntinda Court",
    amount: "UGX 950,000",
    status: "Pending",
    avatar: "bg-amber-100 text-amber-700",
  },
  {
    initials: "JM",
    name: "Joseph Mugisha",
    unit: "A1 · Kololo Heights",
    amount: "UGX 2,400,000",
    status: "Overdue",
    avatar: "bg-purple-100 text-purple-700",
  },
];

const STATUS_STYLE: Record<string, string> = {
  Paid: "bg-ivy-100 text-ivy-800",
  Pending: "bg-amber-100 text-amber-800",
  Overdue: "bg-red-100 text-red-700",
};

/** A static, illustrative product screenshot — not live data. */
export function DashboardPreview() {
  return (
    <div className="relative" aria-hidden="true">
      <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="hidden w-36 shrink-0 bg-ivy-900 p-4 sm:block">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <LogoMark className="h-5 w-5" />
            kezavi
          </div>
          <nav className="mt-6 space-y-1 text-xs">
            {NAV_ITEMS.map((item, i) => (
              <div
                key={item}
                className={`rounded-md px-2 py-1.5 ${i === 0 ? "bg-white font-medium text-ivy-900" : "text-ivy-200"}`}
              >
                {item}
              </div>
            ))}
          </nav>
        </div>

        <div className="min-w-0 flex-1 bg-sand p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-slate-400">Thursday, 25 September</p>
              <p className="text-sm font-semibold text-slate-900">Good morning, Caccra</p>
            </div>
            <span className="rounded-md bg-ivy-900 px-2.5 py-1.5 text-xs font-medium text-white">+ Add property</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-2.5">
                <p className="text-[9px] font-medium tracking-wide text-slate-400">{s.label}</p>
                <p className="mt-0.5 text-base font-semibold text-slate-900">{s.value}</p>
                <p className={`text-[10px] ${s.noteTone ?? "text-slate-500"}`}>{s.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-900">Recent payments</p>
              <p className="text-[10px] text-ivy-700">View all</p>
            </div>
            <div className="mt-2 space-y-1.5">
              {PAYMENTS.map((p) => (
                <div key={p.name} className="flex items-center justify-between rounded-md px-1.5 py-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ${p.avatar}`}
                    >
                      {p.initials}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-medium text-slate-900">{p.name}</span>
                      <span className="block truncate text-[10px] text-slate-400">{p.unit}</span>
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[10px] text-slate-600">{p.amount}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${STATUS_STYLE[p.status]}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-4 left-4 right-4 flex items-center gap-2 rounded-xl bg-ivy-900 px-3 py-2.5 shadow-lg sm:left-auto sm:right-6 sm:w-64">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-clay text-white">✓</span>
        <span className="min-w-0">
          <span className="block text-[11px] font-medium text-white">Mobile money received</span>
          <span className="block truncate text-[10px] text-ivy-100">UGX 1,200,000 · Unit B2, Kira Gardens</span>
        </span>
      </div>
    </div>
  );
}
