import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getLeaseAgreementData } from "@/lib/data";
import { LeaseAgreementView } from "@/components/lease-agreement-view";
import { canManageProperty } from "@/lib/authorization";

export default async function LandlordLeaseAgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(["LANDLORD", "PROPERTY_MANAGER"]);

  const lease = await getLeaseAgreementData(id);
  if (!lease || !(await canManageProperty(user.id, user.role, lease.unit.propertyId))) {
    notFound();
  }

  return <LeaseAgreementView lease={lease} />;
}
