import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getLeaseAgreementData } from "@/lib/data";
import { LeaseAgreementView } from "@/components/lease-agreement-view";

export default async function LandlordLeaseAgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser("LANDLORD");

  const lease = await getLeaseAgreementData(id);
  if (!lease || lease.unit.property.landlordId !== user.id) {
    notFound();
  }

  return <LeaseAgreementView lease={lease} />;
}
