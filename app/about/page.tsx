import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { Card } from "@/components/ui";

const VALUES = [
  {
    title: "Simplicity",
    description:
      "We'd rather build one clear screen than five configurable ones. If a feature needs a manual, we've usually done something wrong.",
  },
  {
    title: "Transparency",
    description:
      "A landlord and their tenant see the same rent history, the same receipts, the same numbers — no figure that only makes sense to one side.",
  },
  {
    title: "Automation that's earned",
    description:
      "Rent reminders, receipts, and late fees happen on their own, on schedule — not as another thing someone has to remember to do.",
  },
  {
    title: "Reliability",
    description: "Payments and lease records touch people's money and their homes. We'd rather ship it solid than ship it fast.",
  },
  {
    title: "Built for how Uganda actually rents",
    description:
      "Mobile Money, phone-number logins, WhatsApp contact links — shaped around how landlords and tenants here actually pay and communicate, not adapted from a template built somewhere else.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col bg-sand">
      <PublicHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Making property management simpler
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            Kezavi was created with one goal: to make property and tenancy management easier, more
            organized, and more accessible for Uganda&apos;s landlords, property managers, and tenants.
          </p>
          <p className="mt-4 text-slate-600">
            Managing properties involves many moving parts — tenants, leases, rent payments,
            maintenance, documents, expenses, and daily communication. Without the right tools,
            keeping everything organized can become time-consuming and complicated. Kezavi brings
            these activities together in one centralized platform, giving property owners and
            managers the tools they need to run their portfolios efficiently.
          </p>
        </section>

        <section className="border-t border-slate-200 bg-white py-16">
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-6 sm:grid-cols-2">
            <Card>
              <h2 className="mb-2 text-lg font-medium text-slate-900">Our mission</h2>
              <p className="text-sm text-slate-600">
                Replace the notebook, the stack of receipts, and the &ldquo;let me check and get back
                to you&rdquo; with a system that just knows — so landlords spend their time growing
                their portfolio, not chasing paperwork for it.
              </p>
            </Card>
            <Card>
              <h2 className="mb-2 text-lg font-medium text-slate-900">Our vision</h2>
              <p className="text-sm text-slate-600">
                Every landlord in Uganda, however many properties they own, always knows exactly
                who&apos;s paid, who hasn&apos;t, and what needs their attention today — without
                opening a spreadsheet to find out.
              </p>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="mb-8 text-center text-2xl font-semibold text-slate-900">What we value</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((value) => (
              <Card key={value.title}>
                <h3 className="mb-1 text-sm font-medium text-slate-900">{value.title}</h3>
                <p className="text-sm text-slate-600">{value.description}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
