import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getInvoiceDetail } from "@/lib/data";
import { InvoiceView } from "@/components/invoice-view";
import { canManageProperty } from "@/lib/authorization";

export default async function LandlordInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(["LANDLORD", "PROPERTY_MANAGER"]);

  const invoice = await getInvoiceDetail(id);
  if (!invoice || !(await canManageProperty(user.id, user.role, invoice.lease.unit.propertyId))) {
    notFound();
  }

  return <InvoiceView invoice={invoice} receiptHrefPrefix="/landlord/receipts" />;
}
