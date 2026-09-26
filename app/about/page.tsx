import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { Card } from "@/components/ui";

const VALUES = [
  {
    title: "Simplicity",
    description: "We make complex property management tasks easier to understand and manage.",
  },
  {
    title: "Transparency",
    description: "Clear information helps landlords, managers, and tenants make informed decisions.",
  },
  {
    title: "Efficiency",
    description: "We help reduce repetitive administrative work and keep important tasks organized.",
  },
  {
    title: "Reliability",
    description: "Your property information and operations deserve dependable tools.",
  },
  {
    title: "Customer focus",
    description: "We build around the everyday needs of the people who manage and live in properties.",
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
                To simplify property management through technology. We believe property
                professionals should spend less time on administrative tasks and more time growing
                their businesses and taking care of their properties and tenants.
              </p>
            </Card>
            <Card>
              <h2 className="mb-2 text-lg font-medium text-slate-900">Our vision</h2>
              <p className="text-sm text-slate-600">
                A simpler, smarter future for real estate management — where property information
                is easy to access, payments are easy to track, maintenance is easy to manage, and
                owners always have a clear picture of their business.
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
