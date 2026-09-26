import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { Card } from "@/components/ui";
import { ContactForm } from "@/components/forms/contact-form";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE;

const HELP_TOPICS = [
  "Getting started",
  "Setting up your properties",
  "Managing tenants",
  "Payments and billing",
  "Technical support",
  "General questions",
];

export default function ContactPage() {
  return (
    <div className="flex flex-1 flex-col bg-sand">
      <PublicHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Let&apos;s talk about your property management needs
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          Have a question about Kezavi, need help getting started, or want to learn more about our
          platform? We&apos;re here to help.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ContactForm />
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Card>
              <h2 className="mb-3 text-sm font-medium text-slate-900">Contact information</h2>
              <div className="space-y-3 text-sm">
                {SUPPORT_EMAIL && (
                  <div>
                    <p className="text-slate-500">Email</p>
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-ivy-700 hover:text-ivy-800">
                      {SUPPORT_EMAIL}
                    </a>
                  </div>
                )}
                {SUPPORT_PHONE && (
                  <div>
                    <p className="text-slate-500">Phone</p>
                    <p className="font-medium text-slate-900">{SUPPORT_PHONE}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500">Address</p>
                  <p className="font-medium text-slate-900">Kampala, Uganda</p>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="mb-3 text-sm font-medium text-slate-900">Need help?</h2>
              <p className="mb-3 text-sm text-slate-600">Our team can help you with:</p>
              <ul className="space-y-1.5 text-sm text-slate-600">
                {HELP_TOPICS.map((topic) => (
                  <li key={topic} className="flex items-center gap-2">
                    <span className="text-ivy-600">✓</span>
                    {topic}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
