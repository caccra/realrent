import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getTenantActiveLeases, getTenantDocuments, getTenantStats } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge, Card } from "@/components/ui";
import { formatUGX } from "@/lib/money";
import { invoiceDisplayStatus } from "@/lib/invoice-status";
import { invoiceTotalDue } from "@/lib/invoice-total";
import { PaymentMethodsDisplay } from "@/components/payment-methods-display";
import { NewComplaintForm } from "@/components/forms/new-complaint-form";
import { TenantPropertyCard } from "@/components/tenant-property-card";
import { ReviewForm } from "@/components/forms/review-form";
import { SignedAgreementUpload } from "@/components/forms/signed-agreement-upload";
import { TenantDocumentsSection } from "@/components/forms/tenant-documents-section";
import { MessagesPanel } from "@/components/forms/messages-panel";

const NAV = [{ href: "/tenant/dashboard", label: "Dashboard" }];

const STATUS_TONE = {
  PAID: "green",
  PARTIAL: "amber",
  OVERDUE: "red",
  PENDING: "slate",
} as const;

const COMPLAINT_STATUS_TONE = {
  OPEN: "red",
  IN_PROGRESS: "amber",
  RESOLVED: "green",
} as const;

export default async function TenantDashboard() {
  const user = await requireUser("TENANT");
  const [leases, stats, documents] = await Promise.all([
    getTenantActiveLeases(user.id),
    getTenantStats(user.id),
    getTenantDocuments(user.id),
  ]);

  return (
    <DashboardShell title="My rentals" userName={user.name ?? ""} nav={NAV}>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Outstanding balance</p>
          <p
            className={`mt-1 text-2xl font-semibold ${stats.outstandingBalance > 0 ? "text-red-700" : "text-slate-900"}`}
          >
            {formatUGX(stats.outstandingBalance)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Next payment due</p>
          {stats.nextDue ? (
            <>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {formatUGX(stats.nextDue.amount)}
              </p>
              <p className="text-sm text-slate-500">
                {stats.nextDue.propertyLabel} · due{" "}
                {new Date(stats.nextDue.dueDate).toLocaleDateString("en-UG")}
              </p>
            </>
          ) : (
            <p className="mt-1 text-2xl font-semibold text-slate-900">—</p>
          )}
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total paid</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatUGX(stats.totalPaid)}</p>
        </Card>
      </div>

      <TenantDocumentsSection documents={documents} />

      {leases.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">
            You don&apos;t have an active lease yet. Ask your landlord to create one using your
            phone number.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {leases.map((lease) => {
            const myReview = lease.reviews.find((r) => r.direction === "TENANT_TO_LANDLORD");
            return (
            <div key={lease.id}>
              <div className="mb-3">
                <h2 className="text-lg font-medium text-slate-900">
                  {lease.unit.property.name} — {lease.unit.label}
                </h2>
                <p className="text-sm text-slate-500">Landlord: {lease.unit.property.landlord.name}</p>
                <Link
                  href={`/tenant/leases/${lease.id}/agreement`}
                  className="mt-1 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                  View auto-generated agreement →
                </Link>
              </div>

              <Card className="mb-4 space-y-3">
                {lease.agreementFileUrl && (
                  <div>
                    <p className="text-sm font-medium text-slate-900">Agreement from your landlord</p>
                    <a
                      href={lease.agreementFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                    >
                      {lease.agreementFileName ?? "Download file"} →
                    </a>
                  </div>
                )}
                <SignedAgreementUpload
                  leaseId={lease.id}
                  currentFileUrl={lease.signedAgreementFileUrl}
                  currentFileName={lease.signedAgreementFileName}
                />
              </Card>

              <TenantPropertyCard lease={lease} />

              {lease.rentChanges.some((rc) => new Date(rc.effectiveDate) > new Date()) && (
                <Card className="mb-4 border-amber-200 bg-amber-50">
                  {lease.rentChanges
                    .filter((rc) => new Date(rc.effectiveDate) > new Date())
                    .map((rc) => (
                      <p key={rc.id} className="text-sm text-amber-900">
                        Rent will change to {formatUGX(rc.newRentAmount.toString())} starting{" "}
                        {new Date(rc.effectiveDate).toLocaleDateString("en-UG")}
                        {rc.note && ` — ${rc.note}`}
                      </p>
                    ))}
                </Card>
              )}

              {(lease.unit.property.landlord.acceptsCash ||
                lease.unit.property.landlord.acceptsMobileMoney ||
                lease.unit.property.landlord.acceptsBankTransfer) && (
                <Card className="mb-4">
                  <p className="mb-2 text-sm font-medium text-slate-900">
                    How to pay {lease.unit.property.landlord.name}
                  </p>
                  <PaymentMethodsDisplay landlord={lease.unit.property.landlord} showDetails />
                </Card>
              )}

              <div className="space-y-4">
                {lease.invoices.map((invoice) => {
                  const status = invoiceDisplayStatus(invoice);
                  const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                  const totalDue = invoiceTotalDue(invoice);
                  const remaining = totalDue - paid;
                  const successfulPayment = invoice.payments.find((p) => p.receipt);
                  const hasLateFee = Number(invoice.lateFeeAmount) > 0;

                  return (
                    <Card key={invoice.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-900">
                            {new Date(invoice.periodStart).toLocaleDateString("en-UG")} –{" "}
                            {new Date(invoice.periodEnd).toLocaleDateString("en-UG")}
                          </p>
                          <p className="text-sm text-slate-500">
                            Due {new Date(invoice.dueDate).toLocaleDateString("en-UG")} ·{" "}
                            {formatUGX(totalDue)}
                            {hasLateFee && ` (incl. ${formatUGX(invoice.lateFeeAmount.toString())} late fee)`}
                            {remaining > 0 && paid > 0 && ` · ${formatUGX(remaining)} remaining`}
                          </p>
                        </div>
                        <Badge tone={STATUS_TONE[status]}>{status}</Badge>
                      </div>
                      {successfulPayment?.receipt && (
                        <Link
                          href={`/tenant/receipts/${successfulPayment.receipt.id}`}
                          className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800"
                        >
                          View receipt →
                        </Link>
                      )}
                    </Card>
                  );
                })}
              </div>

              <div className="mt-4">
                <ReviewForm
                  leaseId={lease.id}
                  title={`Rate ${lease.unit.property.name}`}
                  defaultValues={myReview ? { rating: myReview.rating, comment: myReview.comment ?? "" } : undefined}
                />
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-900">Complaints / issues</h3>
                  <NewComplaintForm leaseId={lease.id} />
                </div>
                {lease.complaints.length > 0 && (
                  <div className="space-y-2">
                    {lease.complaints.map((c) => (
                      <Card key={c.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{c.title}</p>
                          <p className="text-sm text-slate-500">
                            {new Date(c.createdAt).toLocaleDateString("en-UG")}
                            {c.images.length > 0 &&
                              ` · ${c.images.length} photo${c.images.length === 1 ? "" : "s"}`}
                          </p>
                        </div>
                        <Badge tone={COMPLAINT_STATUS_TONE[c.status]}>{c.status.replace("_", " ")}</Badge>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <MessagesPanel leaseId={lease.id} />
              </div>
            </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
