import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getInvoiceDetail } from "@/lib/data";
import { InvoiceView } from "@/components/invoice-view";

const PAYMENT_BANNER: Record<string, { tone: string; text: string }> = {
  success: { tone: "bg-ivy-50 text-ivy-800 border-ivy-200", text: "Payment received — thank you." },
  failed: { tone: "bg-red-50 text-red-800 border-red-200", text: "The payment didn't go through. Please try again." },
  cancelled: { tone: "bg-amber-50 text-amber-800 border-amber-200", text: "Payment was cancelled." },
};

export default async function TenantInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { id } = await params;
  const { payment } = await searchParams;
  const user = await requireUser("TENANT");

  const invoice = await getInvoiceDetail(id);
  if (!invoice || invoice.lease.tenantId !== user.id) {
    notFound();
  }

  const banner = payment ? PAYMENT_BANNER[payment] : undefined;

  return (
    <>
      {banner && (
        <div className={`mx-auto mt-6 max-w-2xl rounded-md border px-4 py-3 text-sm ${banner.tone}`}>
          {banner.text}
        </div>
      )}
      <InvoiceView invoice={invoice} receiptHrefPrefix="/tenant/receipts" showPayOnline />
    </>
  );
}
