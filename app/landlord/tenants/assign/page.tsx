import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";
import { AssignTenantForm } from "@/components/forms/assign-tenant-form";
import { Card } from "@/components/ui";
import { navForRole } from "@/lib/landlord-nav";
import { landlordOrManagerFilter } from "@/lib/data";
import Link from "next/link";

export default async function AssignTenantPage() {
  const user = await requireUser(["LANDLORD", "PROPERTY_MANAGER"]);

  const properties = await prisma.property.findMany({
    where: { ...landlordOrManagerFilter(user.id), units: { some: { status: "VACANT" } } },
    orderBy: { name: "asc" },
    include: {
      units: {
        where: { status: "VACANT" },
        orderBy: { label: "asc" },
      },
    },
  });

  return (
    <DashboardShell title="Assign a tenant" userName={user.name ?? ""} nav={navForRole(user.role)}>
      {properties.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">
            None of your properties have a vacant unit right now.{" "}
            <Link href="/landlord/properties" className="font-medium text-ivy-700 hover:text-ivy-800">
              Add a unit
            </Link>{" "}
            before assigning a tenant.
          </p>
        </Card>
      ) : (
        <AssignTenantForm
          properties={properties.map((p) => ({
            id: p.id,
            name: p.name,
            units: p.units.map((u) => ({
              id: u.id,
              label: u.label,
              rentAmount: Number(u.rentAmount),
              billingCycle: u.billingCycle,
            })),
          }))}
        />
      )}
    </DashboardShell>
  );
}
