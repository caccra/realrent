import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { DashboardPreview } from "@/components/dashboard-preview";

function FeatureIcon({ path }: { path: string }) {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ivy-700 text-white">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </svg>
    </span>
  );
}

const ICONS = {
  building: "M4 21V7l8-4 8 4v14M9 21v-6h6v6M4 21h16",
  people: "M8 11a3 3 0 100-6 3 3 0 000 6zM16 11a3 3 0 100-6 3 3 0 000 6zM2 21c0-3.3 2.7-6 6-6s6 2.7 6 6M14 15.2c2.9.4 5 2.9 5 5.8",
  card: "M3 8h18M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zM7 15h4",
  document: "M8 3h6l4 4v14H6V3h2zM14 3v4h4M9 12h6M9 16h6",
  wrench: "M14.7 6.3a4 4 0 10-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.6 2.6-2.8-2.8z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
} as const;

const FEATURES = [
  {
    icon: ICONS.building,
    title: "Properties & units",
    description: "Every building, unit and vacancy in one live register, with photos, documents and rent history.",
  },
  {
    icon: ICONS.people,
    title: "Tenants & leases",
    description: "Onboard tenants, store IDs and sign leases digitally. Kezavi reminds you before any lease ends.",
  },
  {
    icon: ICONS.card,
    title: "Rent collection",
    description: "Accept mobile money and bank payments. Receipts go out on their own, and late rent gets a polite reminder.",
  },
  {
    icon: ICONS.document,
    title: "Landlord statements",
    description: "Deduct fees and expenses automatically and send landlords clear, accurate monthly statements.",
  },
  {
    icon: ICONS.wrench,
    title: "Maintenance",
    description: "Tenants report issues from their phone. Assign them to a technician and track each job until it's fixed.",
  },
  {
    icon: ICONS.chart,
    title: "Reports & insights",
    description: "See occupancy, arrears and income across your whole portfolio at a glance, then export them in one click.",
  },
] as const;

const AUDIENCES = [
  {
    tag: "Property managers",
    title: "Run more doors with the same team",
    bullets: [
      "Manage every client portfolio from one dashboard",
      "Automate rent reminders and receipts",
      "Assign roles and permissions to your staff",
    ],
  },
  {
    tag: "Landlords",
    title: "Know exactly how your property is doing",
    bullets: [
      "Get clear monthly statements",
      "See rent, occupancy and expenses in real time",
      "Approve and track repairs from your phone",
    ],
  },
  {
    tag: "Tenants",
    title: "Renting made simple and transparent",
    bullets: [
      "Pay rent with mobile money in seconds",
      "Report maintenance issues with photos",
      "Keep every receipt and lease in one place",
    ],
  },
] as const;

const STEPS = [
  {
    number: "01",
    title: "Add your properties",
    description: "Add your buildings and units, then invite your team to help manage them.",
  },
  {
    number: "02",
    title: "Invite tenants & landlords",
    description: "Each person gets their own portal, with access that fits their role.",
  },
  {
    number: "03",
    title: "Collect and report",
    description: "Rent comes in, statements go out, and you see everything in one place.",
  },
] as const;

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-sand">
      <PublicHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ivy-100 px-3 py-1 text-xs font-medium text-ivy-800">
                <span className="h-1.5 w-1.5 rounded-full bg-clay" />
                Property management software
              </span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Every property, tenant and landlord. One place.
              </h1>
              <p className="mt-5 max-w-lg text-lg text-slate-600">
                Kezavi keeps your whole real estate business in one place. Track units, sign leases,
                collect rent and pay landlords without juggling spreadsheets.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/register?role=LANDLORD"
                  className="rounded-md bg-ivy-700 px-5 py-3 text-sm font-medium text-white hover:bg-ivy-800"
                >
                  Get started free
                </Link>
                <Link
                  href="/properties"
                  className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Browse properties
                </Link>
              </div>
              <p className="mt-5 text-sm text-slate-500">
                No card needed · Set up in minutes · Works on phone and desktop
              </p>
            </div>

            <div className="pb-4 lg:pb-0">
              <DashboardPreview />
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr] lg:items-end">
              <div>
                <p className="text-xs font-semibold tracking-wide text-clay">FEATURES</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                  Everything your real estate business runs on
                </h2>
              </div>
              <p className="text-slate-600">
                From the first viewing to the monthly landlord statement, every step lives in one tidy
                workspace.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-xl border border-slate-200 bg-sand p-6">
                  <FeatureIcon path={f.icon} />
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="who-its-for" className="bg-ivy-900 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-xs font-semibold tracking-wide text-clay">WHO IT&rsquo;S FOR</p>
            <h2 className="mt-2 max-w-xl text-2xl font-bold text-white sm:text-3xl">
              One platform for everyone in the lease
            </h2>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {AUDIENCES.map((a) => (
                <div key={a.tag} className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <p className="text-xs font-semibold text-clay">{a.tag}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{a.title}</h3>
                  <ul className="mt-4 space-y-2">
                    {a.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-ivy-100">
                        <span className="mt-0.5 text-clay">✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-xs font-semibold tracking-wide text-clay">HOW IT WORKS</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Up and running in an afternoon</h2>

            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.number} className="border-t-2 border-slate-200 pt-4">
                  <p className="text-2xl font-bold text-clay">{s.number}</p>
                  <h3 className="mt-2 text-base font-semibold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-ivy-900 py-16 text-center">
          <div className="mx-auto max-w-2xl px-6">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to bring it all together?</h2>
            <p className="mt-3 text-ivy-100">
              Stop juggling spreadsheets, paperwork, and scattered conversations. Bring your properties,
              tenants, payments, and operations together with Kezavi.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register?role=LANDLORD"
                className="rounded-md bg-clay px-5 py-3 text-sm font-medium text-white hover:opacity-90"
              >
                Get started free
              </Link>
              <Link href="/properties" className="rounded-md px-5 py-3 text-sm font-medium text-white hover:text-ivy-100">
                Browse available properties →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
