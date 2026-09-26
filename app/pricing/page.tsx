import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/money";

const PLANS = [
  {
    name: "Starter",
    tagline: "For a landlord managing their first few properties.",
    price: 0,
    unit: "up to 5 units",
    highlight: false,
    cta: { label: "Get started free", href: "/register?role=LANDLORD" },
    features: [
      "Digital leases & e-signing",
      "Rent invoicing & automatic receipts",
      "Cash payment recording",
      "Tenant portal",
      "Email notifications & reminders",
    ],
  },
  {
    name: "Growth",
    tagline: "For a landlord or property manager running a growing portfolio.",
    price: 150000,
    unit: "up to 50 units",
    highlight: true,
    cta: { label: "Get started", href: "/register?role=LANDLORD" },
    features: [
      "Everything in Starter",
      "Mobile Money rent collection",
      "Property managers & caretakers",
      "Maintenance tracking",
      "Reports & CSV export",
      "WhatsApp contact links",
    ],
  },
  {
    name: "Portfolio",
    tagline: "For teams managing many properties across multiple owners.",
    price: 400000,
    unit: "up to 200 units",
    highlight: false,
    cta: { label: "Get started", href: "/register?role=LANDLORD" },
    features: [
      "Everything in Growth",
      "Owner monthly statements",
      "Move-in/move-out inspections",
      "Two-factor authentication",
      "Audit log",
      "Priority support",
    ],
  },
] as const;

const FAQS = [
  {
    q: "Is Kezavi really free right now?",
    a: "Yes. Kezavi is in early access and every feature is available at no cost while we build out billing. The plans above show where pricing is headed, not what you're charged today.",
  },
  {
    q: "Will I lose data or access when paid plans launch?",
    a: "No. We'll give existing users advance notice and a clear path to keep using the platform before any billing begins.",
  },
  {
    q: "What counts as a \"unit\"?",
    a: "Each individually rentable space — an apartment, a room, a shop, a standalone house — counts as one unit, whether it's currently occupied or vacant.",
  },
  {
    q: "Do you have a plan for a single house or a large estate?",
    a: "The tiers above are a starting point, not a hard limit. If your portfolio doesn't fit neatly into one, get in touch and we'll figure out what makes sense.",
  },
] as const;

export default function PricingPage() {
  return (
    <div className="flex flex-1 flex-col bg-sand">
      <PublicHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            Plans built around the size of your portfolio, not hidden fees or surprise limits.
          </p>
          <p className="mx-auto mt-4 max-w-xl rounded-md border border-ivy-200 bg-ivy-50 px-4 py-2 text-sm text-ivy-800">
            Kezavi is free to use during early access. The plans below show where pricing is
            headed — nothing is charged today.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={plan.highlight ? "relative border-ivy-300 ring-1 ring-ivy-300" : undefined}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-clay px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h2 className="font-heading text-lg font-bold text-slate-900">{plan.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>

                <p className="mt-5">
                  <span className="text-3xl font-bold text-slate-900">
                    {plan.price === 0 ? "Free" : formatMoney(plan.price, "UGX")}
                  </span>
                  {plan.price > 0 && <span className="text-sm text-slate-500"> / month</span>}
                </p>
                <p className="mt-1 text-sm text-slate-500">{plan.unit}</p>

                <Link
                  href={plan.cta.href}
                  className={`mt-6 block rounded-md px-4 py-2.5 text-center text-sm font-medium ${
                    plan.highlight
                      ? "bg-ivy-700 text-white hover:bg-ivy-800"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {plan.cta.label}
                </Link>

                <ul className="mt-6 space-y-2 border-t border-slate-100 pt-6 text-sm text-slate-600">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-0.5 text-ivy-600">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <Card className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-900">Enterprise</h2>
              <p className="mt-1 text-sm text-slate-600">
                Larger portfolios, multiple owner accounts, or custom onboarding — let&rsquo;s talk
                about what you need.
              </p>
            </div>
            <Link
              href="/contact"
              className="shrink-0 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Contact us
            </Link>
          </Card>
        </section>

        <section className="border-t border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-center font-heading text-2xl font-bold text-slate-900">
              Frequently asked questions
            </h2>
            <div className="mt-8 space-y-6">
              {FAQS.map((item) => (
                <div key={item.q}>
                  <h3 className="text-sm font-semibold text-slate-900">{item.q}</h3>
                  <p className="mt-1 text-sm text-slate-600">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 text-center">
          <div className="mx-auto max-w-2xl px-6">
            <h2 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
              Ready to bring it all together?
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register?role=LANDLORD"
                className="rounded-md bg-ivy-700 px-5 py-3 text-sm font-medium text-white hover:bg-ivy-800"
              >
                Get started free
              </Link>
              <Link
                href="/contact"
                className="rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Talk to us
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
