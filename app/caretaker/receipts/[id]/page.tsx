import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getReceiptDetail } from "@/lib/data";
import { ReceiptView } from "@/components/receipt-view";
import { canManageProperty } from "@/lib/authorization";

export default async function CaretakerReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser("CARETAKER");

  const receipt = await getReceiptDetail(id);
  if (
    !receipt ||
    !(await canManageProperty(user.id, user.role, receipt.payment.invoice.lease.unit.propertyId))
  ) {
    notFound();
  }

  return <ReceiptView receipt={receipt} />;
}
