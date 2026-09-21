import { formatUGX } from "@/lib/money";
import { formatPhoneForDisplay } from "@/lib/phone";
import { PrintButton } from "@/components/print-button";

type AgreementLease = {
  id: string;
  startDate: Date;
  endDate: Date | null;
  rentAmount: unknown;
  depositAmount: unknown;
  tenant: { name: string; phone: string | null };
  unit: {
    label: string;
    billingCycle: string;
    property: {
      name: string;
      address: string;
      landlord: { name: string; phone: string | null };
    };
  };
};

export function LeaseAgreementView({ lease }: { lease: AgreementLease }) {
  const { unit } = lease;
  const { property } = unit;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-sm">
        <h1 className="text-xl font-semibold text-slate-900">Tenancy Agreement</h1>
        <p className="mt-1 text-slate-500">
          {property.name} — {unit.label}
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="font-medium text-slate-900">Landlord</p>
            <p className="text-slate-600">{property.landlord.name}</p>
            <p className="text-slate-600">
              {property.landlord.phone ? formatPhoneForDisplay(property.landlord.phone) : "—"}
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-900">Tenant</p>
            <p className="text-slate-600">{lease.tenant.name}</p>
            <p className="text-slate-600">
              {lease.tenant.phone ? formatPhoneForDisplay(lease.tenant.phone) : "—"}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-2 border-t border-slate-200 pt-4">
          <Row label="Property address" value={property.address} />
          <Row label="Unit" value={unit.label} />
          <Row label="Lease start date" value={new Date(lease.startDate).toLocaleDateString("en-UG")} />
          {lease.endDate && (
            <Row label="Lease end date" value={new Date(lease.endDate).toLocaleDateString("en-UG")} />
          )}
          <Row label="Rent" value={`${formatUGX(String(lease.rentAmount))} / ${unit.billingCycle.toLowerCase()}`} />
          <Row label="Security deposit" value={formatUGX(String(lease.depositAmount))} />
        </div>

        <div className="mt-6 space-y-3 border-t border-slate-200 pt-4">
          <p className="font-medium text-slate-900">Terms</p>
          <ol className="list-decimal space-y-2 pl-5 text-slate-600">
            <li>
              Rent is payable in advance for each billing period, on or before the due date shown on
              the tenant&apos;s invoice.
            </li>
            <li>
              The security deposit is refundable at the end of the tenancy, less any deductions for
              damage beyond normal wear and tear or unpaid rent.
            </li>
            <li>
              Either party must give at least one full billing period&apos;s written notice before
              ending the tenancy, unless otherwise agreed.
            </li>
            <li>
              The tenant is responsible for keeping the unit clean and reporting any maintenance
              issues promptly. The landlord is responsible for structural repairs and maintaining the
              property in a habitable condition.
            </li>
            <li>
              The landlord or an appointed caretaker may enter the unit with reasonable prior notice
              to carry out inspections or repairs.
            </li>
            <li>
              Any change to the rent amount will be communicated to the tenant in advance of the
              effective date.
            </li>
          </ol>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-8 border-t border-slate-200 pt-6 text-slate-600">
          <div>
            <p className="mb-8">Landlord signature</p>
            <p className="border-t border-slate-300 pt-1 text-xs">{property.landlord.name}</p>
          </div>
          <div>
            <p className="mb-8">Tenant signature</p>
            <p className="border-t border-slate-300 pt-1 text-xs">{lease.tenant.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900">{value}</span>
    </div>
  );
}
