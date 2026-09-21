import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getLeaseAgreementData } from "@/lib/data";
import { LeaseAgreementView } from "@/components/lease-agreement-view";

export default async function TenantLeaseAgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser("TENANT");

  const lease = await getLeaseAgreementData(id);
  if (!lease || lease.tenantId !== user.id) {
    notFound();
  }

  return <LeaseAgreementView lease={lease} />;
}
