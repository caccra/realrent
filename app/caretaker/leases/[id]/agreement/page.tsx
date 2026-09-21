import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getLeaseAgreementData } from "@/lib/data";
import { canManageProperty } from "@/lib/authorization";
import { LeaseAgreementView } from "@/components/lease-agreement-view";

export default async function CaretakerLeaseAgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser("CARETAKER");

  const lease = await getLeaseAgreementData(id);
  if (!lease || !(await canManageProperty(user.id, user.role, lease.unit.propertyId))) {
    notFound();
  }

  return <LeaseAgreementView lease={lease} />;
}
