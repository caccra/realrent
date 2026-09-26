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
