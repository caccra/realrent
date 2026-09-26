import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-lg font-medium text-slate-900">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export default function CookiePolicyPage() {
  return (
    <div className="flex flex-1 flex-col bg-sand">
      <PublicHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">Cookie Policy</h1>
        <p className="mb-8 text-sm text-slate-500">
          Last updated: {new Date().toLocaleDateString("en-UG", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <Section title="1. What cookies we use">
          <p>
            Kezavi uses a small number of strictly necessary cookies to keep you signed in and to
            protect your account. We don&apos;t use third-party advertising or analytics cookies, and
            we don&apos;t sell or share cookie data with anyone.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium text-slate-700">Session cookie:</span> keeps you logged in
              between page visits. Without it, you&apos;d have to log in on every page.
            </li>
            <li>
              <span className="font-medium text-slate-700">CSRF token cookie:</span> a security
              measure that protects your account from cross-site request forgery attacks.
            </li>
          </ul>
        </Section>

        <Section title="2. Why we don't use tracking cookies">
          <p>
            We&apos;d rather build a platform that works well than track how you use it. Kezavi
            doesn&apos;t include Google Analytics, advertising pixels, or any other third-party
            tracking script.
          </p>
        </Section>

        <Section title="3. Local storage">
          <p>
            Some parts of the app (like offline support) may use your browser&apos;s local storage
            to remember small preferences on your device. This data stays on your device and is
            never sent to our servers.
          </p>
        </Section>

        <Section title="4. Managing cookies">
          <p>
            Because our session cookie is required to keep you logged in, blocking it will prevent
            you from using the parts of Kezavi that require an account (dashboards, leases,
            payments). You&apos;re still free to browse public property listings without one.
          </p>
        </Section>

        <Section title="5. Questions">
          <p>
            If you have questions about this policy, reach out through our{" "}
            <a href="/contact" className="font-medium text-ivy-700 hover:text-ivy-800">
              Contact page
            </a>
            .
          </p>
        </Section>
      </main>

      <PublicFooter />
    </div>
  );
}
