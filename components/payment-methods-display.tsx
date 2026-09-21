import { Badge } from "@/components/ui";
import { MOMO_PROVIDERS } from "@/lib/validations/payment-preferences";

type LandlordPaymentInfo = {
  acceptsCash: boolean;
  acceptsMobileMoney: boolean;
  momoProvider: string | null;
  momoNumber: string | null;
  acceptsBankTransfer: boolean;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
};

export function PaymentMethodsDisplay({
  landlord,
  showDetails,
}: {
  landlord: LandlordPaymentInfo;
  showDetails: boolean;
}) {
  const methods = [
    landlord.acceptsCash && "Cash",
    landlord.acceptsMobileMoney && "Mobile Money",
    landlord.acceptsBankTransfer && "Bank transfer",
  ].filter(Boolean) as string[];

  if (methods.length === 0) return null;

  if (!showDetails) {
    return (
      <div className="flex flex-wrap gap-2">
        {methods.map((m) => (
          <Badge key={m}>{m}</Badge>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      {landlord.acceptsCash && <p className="text-slate-600">Cash accepted</p>}
      {landlord.acceptsMobileMoney && (
        <p className="text-slate-600">
          {MOMO_PROVIDERS.find((p) => p.value === landlord.momoProvider)?.label ?? "Mobile Money"}:{" "}
          <span className="font-medium text-slate-900">{landlord.momoNumber}</span>
        </p>
      )}
      {landlord.acceptsBankTransfer && (
        <p className="text-slate-600">
          {landlord.bankName} — {landlord.bankAccountName}:{" "}
          <span className="font-medium text-slate-900">{landlord.bankAccountNumber}</span>
        </p>
      )}
    </div>
  );
}
