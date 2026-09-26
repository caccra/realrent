import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getReceiptDetail } from "@/lib/data";
import { ReceiptView } from "@/components/receipt-view";

export default async function TenantReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser("TENANT");

  const receipt = await getReceiptDetail(id);
  if (!receipt || receipt.payment.invoice.lease.tenantId !== user.id) {
    notFound();
  }

  return <ReceiptView receipt={receipt} />;
}
