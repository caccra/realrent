import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getCaretakerAssignments } from "@/lib/data";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge, Card } from "@/components/ui";
import { formatUGX } from "@/lib/money";
import { CARETAKER_NAV } from "@/lib/caretaker-nav";

export default async function CaretakerDashboard() {
  const user = await requireUser("CARETAKER");
  const assignments = await getCaretakerAssignments(user.id);

  return (
    <DashboardShell title="My properties" userName={user.name ?? ""} nav={CARETAKER_NAV}>
      {assignments.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">
            You haven&apos;t been appointed to any property yet. Ask the landlord to appoint you
            using your phone number.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {assignments.map(({ property }) => (
            <div key={property.id}>
              <h2 className="mb-3 text-lg font-medium text-slate-900">{property.name}</h2>
              <p className="mb-3 text-sm text-slate-500">
                {property.address}
                {property.location && ` · ${property.location}`}
              </p>
              <div className="space-y-3">
                {property.units.map((unit) => {
                  const activeLease = unit.leases[0];
                  return (
                    <Card key={unit.id}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{unit.label}</p>
                          <p className="text-sm text-slate-500">
                            {formatUGX(unit.rentAmount.toString())} / {unit.billingCycle.toLowerCase()}
                          </p>
                        </div>
                        <Badge tone={unit.status === "OCCUPIED" ? "green" : "slate"}>{unit.status}</Badge>
                      </div>
                      {activeLease && (
                        <div className="mt-3 border-t border-slate-100 pt-3 text-sm">
                          <p className="text-slate-600">
                            Tenant: <span className="text-slate-900">{activeLease.tenant.name}</span>
                          </p>
                          <Link
                            href={`/caretaker/leases/${activeLease.id}`}
                            className="mt-1 inline-block font-medium text-emerald-700 hover:text-emerald-800"
                          >
                            View invoices and record payments →
                          </Link>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
