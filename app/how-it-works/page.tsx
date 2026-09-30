import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { Card } from "@/components/ui";

const STEPS = [
  {
    number: "01",
    title: "Add your properties",
    description: "Start by adding your properties and units to the platform.",
    items: [
      "Property information and location",
      "Units, bedrooms, and dimensions",
      "Rent prices and billing cycle",
      "Amenities and property images",
    ],
    footer: "Get your portfolio organized from day one.",
  },
  {
    number: "02",
    title: "Add your tenants",
    description: "Create tenant profiles and connect each tenant to their property and unit.",
    items: ["Contact information", "Lease details and deposit", "Documents (ID, signed agreements)", "Payment and screening history"],
    footer: "Everything you need about your tenants, in one place.",
  },
  {
    number: "03",
    title: "Manage leases & rent",
    description: "Create and manage leases while keeping track of rent payments and outstanding balances.",
    items: ["Upcoming and paid rent", "Outstanding balances", "Expiring leases", "Full payment history with receipts"],
    footer: "Know what has been paid, what is due, and what needs attention.",
  },
  {
    number: "04",
    title: "Manage maintenance",
    description: "Tenants report issues while managers track, and resolve requests.",
    items: ["Report → Assign → Track → Resolve", "Costs and vendor notes", "Full maintenance history per property"],
    footer: "Keep maintenance requests connected to the right property.",
  },
  {
    number: "05",
    title: "Monitor your business",
    description: "Use your dashboard and reports to understand how your properties are performing.",
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
    summary: "You're renting, and want everything in one place.",
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
    encouragement: "Every property you list is one less spreadsheet, one less missed payment to chase.",
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

export default function HowItWorksPage() {
  return (
    <div className="flex flex-1 flex-col bg-sand">
      <PublicHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Property management made simple
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            Kezavi brings your property operations together in a few simple steps.
          </p>
        </section>

        <section className="mx-auto max-w-3xl space-y-8 px-6 pb-16">
          {STEPS.map((step) => (
            <Card key={step.number}>
              <div className="flex items-start gap-4">
                <span className="text-2xl font-semibold text-ivy-200">{step.number}</span>
                <div>
                  <h2 className="text-lg font-medium text-slate-900">{step.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{step.description}</p>
                  <ul className="mt-3 space-y-1 text-sm text-slate-600">
                    {step.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-0.5 text-ivy-600">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm font-medium text-slate-700">{step.footer}</p>
                </div>
              </div>
            </Card>
          ))}
        </section>

        <section className="border-t border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
              How it works for every role
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              Everyone in a lease gets their own portal, with access that fits what they actually do.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {ROLE_GUIDES.map((guide) => (
                <Card key={guide.role}>
                  <h3 className="font-heading text-base font-bold text-slate-900">{guide.role}</h3>
                  <p className="mt-1 text-sm text-slate-500">{guide.summary}</p>
                  <ol className="mt-4 space-y-2">
                    {guide.steps.map((step, i) => (
                      <li key={step} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ivy-100 text-[11px] font-semibold text-ivy-800">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
              Adding and searching for properties
            </h2>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {PROPERTY_HOWTO.map((guide) => (
                <Card key={guide.title} className="flex h-full flex-col">
                  <h3 className="font-heading text-base font-bold text-slate-900">{guide.title}</h3>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-clay">{guide.who}</p>
                  <ol className="mt-4 space-y-2">
                    {guide.steps.map((step, i) => (
                      <li key={step} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ivy-100 text-[11px] font-semibold text-ivy-800">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  <div className="mt-auto pt-6">
                    <p className="text-sm text-slate-500">{guide.encouragement}</p>
                    <Link
                      href={guide.cta.href}
                      className="mt-3 inline-block rounded-md bg-ivy-700 px-4 py-2 text-sm font-medium text-white hover:bg-ivy-800"
                    >
                      {guide.cta.label}
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white py-16 text-center">
          <h2 className="text-2xl font-semibold text-slate-900">Ready to get started?</h2>
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
