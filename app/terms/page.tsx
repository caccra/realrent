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

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-1 flex-col bg-sand">
      <PublicHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">Terms of Service</h1>
        <p className="mb-8 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString("en-UG", { year: "numeric", month: "long", day: "numeric" })}</p>

        <Section title="1. Acceptance of these terms">
          <p>
            By creating an account or using Kezavi, you agree to these Terms of Service and our{" "}
            <a href="/privacy" className="text-ivy-700 hover:text-ivy-800">
              Privacy Policy
            </a>
            . If you do not agree, please do not use the platform.
          </p>
        </Section>

        <Section title="2. What Kezavi is">
          <p>
            Kezavi is a property and tenancy management tool. It helps landlords, tenants, and
            appointed caretakers manage properties, leases, rent invoicing, cash payment records,
            maintenance requests, and communication. Kezavi does not own, manage, broker, or
            take title to any property listed on the platform.
          </p>
        </Section>

        <Section title="3. Accounts and roles">
          <p>
            You must provide accurate registration information and keep your login credentials
            confidential. Three roles exist:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium text-slate-700">Landlord</span> — lists and manages
              properties, leases, and rent.
            </li>
            <li>
              <span className="font-medium text-slate-700">Tenant</span> — is assigned to a unit
              under a lease and can track rent, submit complaints, and upload documents.
            </li>
            <li>
              <span className="font-medium text-slate-700">Caretaker</span> — appointed by a
              landlord to help manage day-to-day operations for specific properties, with
              permissions the landlord controls.
            </li>
          </ul>
        </Section>

        <Section title="4. Property listings and accuracy">
          <p>
            Landlords are solely responsible for the accuracy of their property listings,
            including ownership, availability, pricing, and legal right to lease the property.
            Kezavi does not verify land title, ownership, or the legal status of any listed
            property. Prospective tenants should independently verify a property and landlord
            before entering into any agreement or making a payment.
          </p>
        </Section>

        <Section title="5. Payments">
          <p>
            Kezavi currently supports recording cash payments and generating receipts within
            the platform. Kezavi does not itself process, hold, or transmit funds between
            tenants and landlords at this time. Any payment arrangement remains directly between
            the tenant and landlord/caretaker; Kezavi is not a party to that transaction and is
            not responsible for payment disputes.
          </p>
        </Section>

        <Section title="6. Acceptable use">
          <p>You agree not to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Post false, misleading, or fraudulent property listings.</li>
            <li>Impersonate another person or misrepresent your role.</li>
            <li>Upload documents or content you do not have the right to share.</li>
            <li>Harass, threaten, or defame other users, including through reviews.</li>
            <li>Attempt to bypass rate limits, security controls, or access another account.</li>
          </ul>
          <p>We may suspend or terminate accounts that violate these terms.</p>
        </Section>

        <Section title="7. Reviews and ratings">
          <p>
            Reviews must reflect a genuine tenancy relationship and honest experience. Reviews
            found to be fabricated, defamatory, or posted in bad faith may be removed.
          </p>
        </Section>

        <Section title="8. Termination">
          <p>
            You may stop using Kezavi at any time. We may suspend or terminate an account that
            violates these terms or poses a risk to other users, with notice where practical.
          </p>
        </Section>

        <Section title="9. Disclaimers and limitation of liability">
          <p>
            Kezavi is provided &quot;as is.&quot; We do not guarantee the accuracy of listings,
            the conduct of landlords, tenants, or caretakers, or that the service will be
            uninterrupted or error-free. To the maximum extent permitted by law, Kezavi is not
            liable for indirect, incidental, or consequential damages arising from your use of
            the platform, including disputes between landlords and tenants.
          </p>
        </Section>

        <Section title="10. Governing law">
          <p>
            These terms are governed by the laws of the Republic of Uganda. Disputes arising from
            use of the platform should first be raised with us using the contact details below,
            with a view to resolving them informally.
          </p>
        </Section>

        <Section title="11. Changes to these terms">
          <p>
            We may update these terms as the product evolves. Continued use of Kezavi after an
            update constitutes acceptance of the revised terms.
          </p>
        </Section>

        <Section title="12. Contact us">
          <p>
            Questions about these terms can be sent to{" "}
            <a href="mailto:legal@realrent.app" className="text-ivy-700 hover:text-ivy-800">
              legal@realrent.app
            </a>
            .
          </p>
        </Section>
      </main>

      <PublicFooter />
    </div>
  );
}
