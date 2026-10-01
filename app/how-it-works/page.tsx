import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

const STEP_ICONS = {
  building: "M4 21V7l8-4 8 4v14M9 21v-6h6v6M4 21h16",
  people: "M8 11a3 3 0 100-6 3 3 0 000 6zM16 11a3 3 0 100-6 3 3 0 000 6zM2 21c0-3.3 2.7-6 6-6s6 2.7 6 6M14 15.2c2.9.4 5 2.9 5 5.8",
  cash: "M3 8h18M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zM7 15h4",
  wrench: "M14.7 6.3a4 4 0 10-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.6 2.6-2.8-2.8z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
} as const;

const STEPS = [
  {
    icon: STEP_ICONS.building,
    title: "Add your properties",
    items: [
      "Property information and location",
      "Units, bedrooms, and dimensions",
      "Rent prices and billing cycle",
      "Amenities and property images",
    ],
    footer: "Get your portfolio organized from day one.",
  },
  {
    icon: STEP_ICONS.people,
    title: "Add your tenants",
    items: ["Contact information", "Lease details and deposit", "Documents (ID, signed agreements)", "Payment and screening history"],
    footer: "Everything you need about your tenants, ready whenever you need it.",
  },
  {
    icon: STEP_ICONS.cash,
    title: "Manage leases & rent",
    items: ["Upcoming and paid rent", "Outstanding balances", "Expiring leases", "Full payment history with receipts"],
    footer: "Know what has been paid, what is due, and what needs attention.",
  },
  {
    icon: STEP_ICONS.wrench,
    title: "Manage maintenance",
    items: ["Report → Assign → Track → Resolve", "Costs and vendor notes", "Full maintenance history per property"],
    footer: "Keep maintenance requests connected to the right property.",
  },
  {
    icon: STEP_ICONS.chart,
    title: "Monitor your business",
    items: ["Occupancy and vacancy trends", "Rental income and expenses", "Outstanding payments", "Lease expirations and performance by property"],
    footer: "Turn your property data into useful insights.",
  },
];

const ROLE_GUIDES = [
  {
    role: "For Landlords",
    summary: "You own the property and want it running itself.",
    steps: [
      "Add your properties and units, with rent, billing cycle, and photos",
      "Create a lease for a tenant by phone number — their account is created automatically",
      "Invoices, reminders (email + SMS), and receipts go out on their own each billing cycle",
      "Record cash payments, or let tenants pay by Mobile Money",
      "Appoint a property manager or caretaker to run specific properties for you",
      "Check reports, occupancy, and tenant history whenever you need to",
    ],
  },
  {
    role: "For Tenants",
    summary: "You're renting, and want a clear view of what you owe and when.",
    steps: [
      "Browse listings and contact a landlord — no account needed to look around",
      "Get added to a lease by your landlord (your account is created for you) or sign up to inquire",
      "See your lease, invoices, and payment history from your dashboard",
      "Pay rent by Mobile Money, or your landlord records a cash payment",
      "Get automatic receipts and reminders by email and SMS",
      "Report maintenance issues with photos, and message your landlord directly",
    ],
  },
  {
    role: "For Property Managers",
    summary: "You run properties on behalf of one or more owners.",
    steps: [
      "Register, then get appointed by a landlord to the properties you'll manage",
      "Get the same working access as the landlord on those properties — leases, rent, maintenance, reports",
      "Manage every property you're appointed to from a single dashboard, across different owners",
      "Handle tenant complaints and maintenance requests as they come in",
      "The only thing you don't touch is the landlord's own payout/billing settings",
    ],
  },
  {
    role: "For Caretakers",
    summary: "You're on the ground, handling day-to-day operations.",
    steps: [
      "Register, then get appointed by a landlord to specific properties",
      "Record rent payments you collect in person",
      "Track tenant complaints and maintenance requests through to resolved",
      "Everything you do is tied to the exact property and tenant it belongs to",
    ],
  },
] as const;

const PROPERTY_HOWTO = [
  {
    title: "Adding a property",
    who: "Landlords & property managers",
    steps: [
      "Go to Properties → Add Property",
      "Enter the name, address, location, usage (residential or commercial), and type",
      "Add amenities and photos",
      "Choose \"For rent\" and add units (label, bedrooms, bathrooms, rent, billing cycle) — or choose \"For sale\" and set a price",
      "It shows up in your dashboard immediately; rentals with a vacant unit appear in public search right away",
    ],
    cta: { label: "List your property free →", href: "/register?role=LANDLORD" },
    encouragement: "Every property you list is one step closer to rent that collects itself.",
  },
  {
    title: "Searching for a property",
    who: "Tenants & anyone browsing",
    steps: [
      "Go to Browse Properties — no account needed",
      "Filter by location, price range, bedrooms, property type, or for rent / for sale",
      "Check photos, amenities, ratings, and reviews from past tenants",
      "Contact the landlord or property manager directly by phone, WhatsApp, or email",
      "Sign up as a tenant to inquire about a listing or get added to a lease",
    ],
    cta: { label: "Browse properties now →", href: "/properties" },
    encouragement: "Real listings from real landlords on Kezavi — take a look, it costs nothing to browse.",
  },
] as const;

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-ivy-100">
      <span className="mt-0.5 text-clay">✓</span>
      {children}
    </li>
  );
}

function StepIcon({ path }: { path: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-clay text-white">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </svg>
    </span>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="flex flex-1 flex-col bg-sand">
      <PublicHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Property management made simple
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            Kezavi brings your property operations together in a few simple steps.
          </p>
        </section>

        <section className="bg-ivy-900 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-xs font-semibold tracking-wide text-clay">GETTING STARTED</p>
            <h2 className="mt-2 max-w-xl font-heading text-2xl font-bold text-white sm:text-3xl">
              Five steps to a running portfolio
            </h2>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {STEPS.map((step, i) => (
                <div key={step.title} className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center gap-3">
                    <StepIcon path={step.icon} />
                    <div>
                      <p className="text-xs font-semibold text-clay">STEP {i + 1}</p>
                      <h3 className="font-heading text-base font-bold text-white">{step.title}</h3>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {step.items.map((item) => (
                      <Check key={item}>{item}</Check>
                    ))}
                  </ul>
                  <p className="mt-4 text-sm font-medium text-white">{step.footer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-ivy-900 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-xs font-semibold tracking-wide text-clay">FOR EVERY ROLE</p>
            <h2 className="mt-2 max-w-xl font-heading text-2xl font-bold text-white sm:text-3xl">
              How it works for every role
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-ivy-100">
              Everyone in a lease gets their own portal, with access that fits what they actually do.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {ROLE_GUIDES.map((guide) => (
                <div key={guide.role} className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <p className="text-xs font-semibold text-clay">{guide.role.toUpperCase()}</p>
                  <h3 className="mt-2 font-heading text-base font-bold text-white">{guide.summary}</h3>
                  <ul className="mt-4 space-y-2">
                    {guide.steps.map((step) => (
                      <Check key={step}>{step}</Check>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-ivy-900 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-xs font-semibold tracking-wide text-clay">PROPERTIES</p>
            <h2 className="mt-2 max-w-xl font-heading text-2xl font-bold text-white sm:text-3xl">
              Adding and searching for properties
            </h2>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {PROPERTY_HOWTO.map((guide) => (
                <div key={guide.title} className="flex h-full flex-col rounded-xl border border-white/10 bg-white/5 p-6">
                  <p className="text-xs font-semibold text-clay">{guide.who.toUpperCase()}</p>
                  <h3 className="mt-2 font-heading text-base font-bold text-white">{guide.title}</h3>
                  <ul className="mt-4 space-y-2">
                    {guide.steps.map((step) => (
                      <Check key={step}>{step}</Check>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6">
                    <p className="text-sm text-ivy-100">{guide.encouragement}</p>
                    <Link
                      href={guide.cta.href}
                      className="mt-3 inline-block rounded-md bg-clay px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      {guide.cta.label}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white py-16 text-center">
          <h2 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">Ready to get started?</h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register?role=LANDLORD"
              className="rounded-md bg-ivy-700 px-5 py-3 text-sm font-medium text-white hover:bg-ivy-800"
            >
              Get Started
            </Link>
            <Link
              href="/properties"
              className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Browse properties
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
