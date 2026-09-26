import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { invoiceDisplayStatus } from "@/lib/invoice-status";
import { invoiceTotalDue } from "@/lib/invoice-total";
import { formatPhoneForDisplay } from "@/lib/phone";
import { RecordPaymentForm } from "@/components/forms/record-payment-form";
import { GenerateInvoiceButton } from "@/components/forms/generate-invoice-button";
import { EndLeaseButton } from "@/components/forms/end-lease-button";
import { LeaseEndDateControl } from "@/components/forms/lease-end-date-control";
import { MarkDepositRefundedButton } from "@/components/forms/mark-deposit-refunded-button";
import { RentChangeSection } from "@/components/forms/rent-change-section";
import { ReviewForm } from "@/components/forms/review-form";
import { LeaseAgreementUpload } from "@/components/forms/lease-agreement-upload";
import { LeaseSignatureSection } from "@/components/forms/lease-signature-section";
import { WhatsAppLink } from "@/components/whatsapp-link";
import { MessagesPanel } from "@/components/forms/messages-panel";
import { SendReminderButton } from "@/components/forms/send-reminder-button";
import { DocumentVerifyToggle } from "@/components/forms/document-verify-toggle";
import { TenantScreeningCard } from "@/components/tenant-screening-card";
import { LeaseLedgerView } from "@/components/lease-ledger-view";
import { NewInspectionForm } from "@/components/forms/new-inspection-form";
import { InspectionView } from "@/components/inspection-view";
import { TENANT_DOCUMENT_TYPES } from "@/lib/validations/tenant-document";
import { INSPECTION_TYPES } from "@/lib/validations/inspection";
import type { getLeaseWithDetails, getTenantScreeningReport } from "@/lib/data";

const STATUS_TONE = {
  PAID: "green",
  PARTIAL: "amber",
  OVERDUE: "red",
  PENDING: "slate",
} as const;

export function LeaseDetailView({
  lease,
  canEndLease,
  canReviewTenant,
  canSignAsLandlord,
  currentUserId,
  agreementHref,
  invoiceHrefPrefix,
  receiptHrefPrefix,
  screeningReport,
}: {
  lease: NonNullable<Awaited<ReturnType<typeof getLeaseWithDetails>>>;
  canEndLease: boolean;
  canReviewTenant: boolean;
  canSignAsLandlord: boolean;
  currentUserId: string;
  agreementHref: string;
  invoiceHrefPrefix: string;
  receiptHrefPrefix: string;
  screeningReport?: Awaited<ReturnType<typeof getTenantScreeningReport>>;
}) {
  const latestInvoice = lease.invoices[0];
  const canGenerateNext = lease.status === "ACTIVE" && latestInvoice?.status === "PAID";
  const tenantReview = lease.reviews.find((r) => r.direction === "LANDLORD_TO_TENANT");
  const usedInspectionTypes = new Set(lease.inspections.map((i) => i.type));
  const availableInspectionTypes = INSPECTION_TYPES.filter((t) => !usedInspectionTypes.has(t.value));

  return (
    <>
      <Card className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <Badge tone={lease.status === "ACTIVE" ? "green" : "slate"}>{lease.status}</Badge>
          {canEndLease && lease.status === "ACTIVE" && (
            <EndLeaseButton
              leaseId={lease.id}
              depositAmount={Number(lease.depositAmount)}
              currency={lease.currency}
            />
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-slate-500">Tenant</p>
            <p className="font-medium text-slate-900">{lease.tenant.name}</p>
            <p className="flex items-center gap-2 text-sm text-slate-500">
              {lease.tenant.phone ? formatPhoneForDisplay(lease.tenant.phone) : "—"}
              <WhatsAppLink
                number={lease.tenant.whatsappNumber}
                message={`Hi ${lease.tenant.name}, this is regarding ${lease.unit.property.name} — ${lease.unit.label}.`}
              />
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Rent</p>
            <p className="font-medium text-slate-900">{formatMoney(lease.rentAmount.toString(), lease.currency)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Deposit</p>
            <p className="font-medium text-slate-900">{formatMoney(lease.depositAmount.toString(), lease.currency)}</p>
          </div>
          {canEndLease && lease.status === "ACTIVE" ? (
            <LeaseEndDateControl leaseId={lease.id} endDate={lease.endDate} />
          ) : (
            <div>
              <p className="text-sm text-slate-500">Lease end date</p>
              <p className="font-medium text-slate-900">
                {lease.endDate ? new Date(lease.endDate).toLocaleDateString("en-UG") : "Open-ended"}
              </p>
            </div>
          )}
        </div>
        <Link
          href={agreementHref}
          className="mt-4 inline-block text-sm font-medium text-ivy-700 hover:text-ivy-800"
        >
          View auto-generated agreement →
        </Link>

        {lease.status !== "ACTIVE" && lease.depositRefundAmount != null && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-900">Deposit settlement</p>
            <div className="mt-2 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-slate-500">Deductions</p>
                <p className="text-slate-900">{formatMoney(Number(lease.depositDeductions ?? 0), lease.currency)}</p>
              </div>
              <div>
                <p className="text-slate-500">Refund due</p>
                <p className="text-slate-900">{formatMoney(Number(lease.depositRefundAmount), lease.currency)}</p>
              </div>
              <div>
                <p className="text-slate-500">Status</p>
                <Badge tone={lease.depositRefundedAt ? "green" : "amber"}>
                  {lease.depositRefundedAt ? "Refunded" : "Pending refund"}
                </Badge>
              </div>
            </div>
            {lease.depositDeductionNote && (
              <p className="mt-2 text-sm text-slate-600">{lease.depositDeductionNote}</p>
            )}
            {canEndLease && !lease.depositRefundedAt && Number(lease.depositRefundAmount) > 0 && (
              <div className="mt-3">
                <MarkDepositRefundedButton leaseId={lease.id} />
              </div>
            )}
          </div>
        )}
      </Card>

      <LeaseSignatureSection
        leaseId={lease.id}
        signatures={lease.signatures}
        canSign={canSignAsLandlord && !lease.signatures.some((s) => s.signerId === currentUserId)}
        signAsRole="LANDLORD"
      />

      <Card className="mb-6 space-y-4">
        <LeaseAgreementUpload
          leaseId={lease.id}
          currentFileUrl={lease.agreementFileUrl}
          currentFileName={lease.agreementFileName}
        />
        <div className="border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-slate-900">Tenant&apos;s signed copy</p>
          {lease.signedAgreementFileUrl ? (
            <a
              href={lease.signedAgreementFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-ivy-700 hover:text-ivy-800"
            >
              {lease.signedAgreementFileName ?? "Download file"} →
            </a>
          ) : (
            <p className="text-sm text-slate-500">Tenant hasn&apos;t uploaded a signed copy yet.</p>
          )}
        </div>
      </Card>

      {lease.tenant.documents.length > 0 && (
        <Card className="mb-6">
          <p className="mb-2 text-sm font-medium text-slate-900">Tenant&apos;s documents</p>
          <ul className="space-y-2">
            {lease.tenant.documents.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-ivy-700 hover:text-ivy-800"
                >
                  {TENANT_DOCUMENT_TYPES.find((t) => t.value === doc.type)?.label ?? doc.type}
                  {doc.label && ` — ${doc.label}`}
                </a>
                <DocumentVerifyToggle documentId={doc.id} verified={doc.verified} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {screeningReport && <TenantScreeningCard report={screeningReport} />}

      <div className="mb-6">
        <h2 className="mb-3 text-lg font-medium text-slate-900">Inspections</h2>
        <NewInspectionForm leaseId={lease.id} availableTypes={availableInspectionTypes} />
        {lease.inspections.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">No inspections recorded yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {lease.inspections.map((inspection) => (
              <InspectionView key={inspection.id} inspection={inspection} />
            ))}
          </div>
        )}
      </div>

      <RentChangeSection leaseId={lease.id} rentChanges={lease.rentChanges} currency={lease.currency} />

      {canReviewTenant && (
        <div className="mb-6">
          <ReviewForm
            leaseId={lease.id}
            title={`Rate ${lease.tenant.name}`}
            defaultValues={
              tenantReview ? { rating: tenantReview.rating, comment: tenantReview.comment ?? "" } : undefined
            }
          />
        </div>
      )}

      <div className="mb-6">
        <LeaseLedgerView invoices={lease.invoices} />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">Invoices</h2>
        {canGenerateNext && <GenerateInvoiceButton leaseId={lease.id} />}
      </div>

      <div className="space-y-4">
        {lease.invoices.map((invoice) => {
          const status = invoiceDisplayStatus(invoice);
          const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
          const totalDue = invoiceTotalDue(invoice);
          const remaining = totalDue - paid;
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
                    {formatMoney(totalDue, invoice.currency)}
                    {hasLateFee && ` (incl. ${formatMoney(invoice.lateFeeAmount.toString(), invoice.currency)} late fee)`}
                    {paid > 0 && status !== "PAID" && ` (${formatMoney(paid, invoice.currency)} paid)`}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[status]}>{status}</Badge>
              </div>

              <Link
                href={`${invoiceHrefPrefix}/${invoice.id}`}
                className="mt-2 inline-block text-xs font-medium text-ivy-700 hover:text-ivy-800"
              >
                View invoice →
              </Link>

              {status !== "PAID" && (
                <div className="mt-3 flex flex-wrap items-start justify-between gap-3 border-t border-slate-100 pt-3">
                  <RecordPaymentForm invoiceId={invoice.id} remainingAmount={remaining} />
                  <SendReminderButton invoiceId={invoice.id} />
                </div>
              )}

              {invoice.payments.length > 0 && (
                <div className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-500">
                  {invoice.payments.map((p) => (
                    <p key={p.id}>
                      {formatMoney(p.amount.toString(), p.currency)} via {p.method} on{" "}
                      {new Date(p.paidAt).toLocaleDateString("en-UG")}
                      {p.receipt && (
                        <>
                          {" · "}
                          <Link
                            href={`${receiptHrefPrefix}/${p.receipt.id}`}
                            className="font-medium text-ivy-700 hover:text-ivy-800"
                          >
                            Receipt {p.receipt.receiptNumber}
                          </Link>
                        </>
                      )}
                    </p>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-6">
        <MessagesPanel leaseId={lease.id} />
      </div>
    </>
  );
}
