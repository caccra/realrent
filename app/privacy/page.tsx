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

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-1 flex-col bg-sand">
      <PublicHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">Privacy Policy</h1>
        <p className="mb-8 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString("en-UG", { year: "numeric", month: "long", day: "numeric" })}</p>

        <Section title="1. Who we are">
          <p>
            Kezavi (&quot;we&quot;, &quot;us&quot;) provides a property and tenancy management
            platform for landlords, tenants, and caretakers in Uganda. This policy explains what
            personal data we collect, why we collect it, and how it is handled.
          </p>
        </Section>

        <Section title="2. Information we collect">
          <p>We collect the following categories of information:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium text-slate-700">Account information:</span> name, phone
              number, email address, and password (stored as a one-way hash, never in plain text).
            </li>
            <li>
              <span className="font-medium text-slate-700">Property and lease data:</span>{" "}
              addresses, unit details, rent amounts, lease terms, and payment records you or your
              landlord/caretaker enter.
            </li>
            <li>
              <span className="font-medium text-slate-700">Identity and supporting documents:</span>{" "}
              national ID, passport, or letters a tenant chooses to upload for verification
              purposes.
            </li>
            <li>
              <span className="font-medium text-slate-700">Photos:</span> property listing images
              and complaint/maintenance photos you upload.
            </li>
            <li>
              <span className="font-medium text-slate-700">Communications:</span> messages sent
              through the in-app messaging feature, complaints, and reviews.
            </li>
          </ul>
          <p>
            We do not use advertising trackers or sell any data to third parties. We do not
            currently run analytics or ad-tracking scripts on this site.
          </p>
        </Section>

        <Section title="3. How we use your information">
          <ul className="list-disc space-y-1 pl-5">
            <li>To operate core features: leases, invoicing, payment records, and receipts.</li>
            <li>To notify you about rent due dates, messages, complaints, and account activity.</li>
            <li>To let landlords verify a tenant&apos;s uploaded documents and rental history.</li>
            <li>To detect and prevent fraud, abuse, and unauthorized access.</li>
          </ul>
        </Section>

        <Section title="4. Who we share information with">
          <p>We share data only with the service providers needed to run Kezavi:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium text-slate-700">Supabase</span> — stores uploaded
              photos and documents.
            </li>
            <li>
              <span className="font-medium text-slate-700">Google</span> — if you choose to sign
              in with Google.
            </li>
            <li>
              <span className="font-medium text-slate-700">Our hosting provider</span> — runs the
              application and database.
            </li>
          </ul>
          <p>
            Within the platform, a tenant&apos;s uploaded documents and rental history are visible
            only to the landlord(s)/caretaker(s) they have an active or prospective lease
            relationship with — not to unrelated landlords browsing the public listings.
          </p>
        </Section>

        <Section title="5. Data retention">
          <p>
            We retain account and lease records for as long as your account is active and for a
            reasonable period afterward to satisfy record-keeping, tax, and dispute-resolution
            needs. You may request deletion of your account as described below, subject to
            records we are required to keep for legal or financial reasons (e.g. payment
            history).
          </p>
        </Section>

        <Section title="6. Your rights">
          <p>
            Consistent with Uganda&apos;s Data Protection and Privacy Act, 2019, you have the
            right to:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your account and associated data, subject to section 5.</li>
            <li>Withdraw consent for optional features (e.g. Google sign-in) at any time.</li>
          </ul>
          <p>
            To exercise any of these rights, contact us using the details in section 10.
          </p>
        </Section>

        <Section title="7. Data security">
          <p>
            Passwords are hashed with bcrypt and never stored in plain text. Access to landlord,
            tenant, and caretaker data is restricted by role — a user can only see the properties,
            leases, and documents they are actually party to. We apply rate limiting to
            authentication endpoints to reduce the risk of automated attacks. No system is
            perfectly secure, and we encourage you to use a strong, unique password.
          </p>
        </Section>

        <Section title="8. Children">
          <p>
            Kezavi is intended for adults entering into or managing tenancy agreements. It is
            not directed at children under 18, and we do not knowingly collect data from them.
          </p>
        </Section>

        <Section title="9. Changes to this policy">
          <p>
            We may update this policy as the product evolves. Material changes will be reflected
            by updating the &quot;Last updated&quot; date above.
          </p>
        </Section>

        <Section title="10. Contact us">
          <p>
            Questions about this policy or your data can be sent to{" "}
            <a href="mailto:privacy@realrent.app" className="text-ivy-700 hover:text-ivy-800">
              privacy@realrent.app
            </a>
            .
          </p>
        </Section>
      </main>

      <PublicFooter />
    </div>
  );
}
