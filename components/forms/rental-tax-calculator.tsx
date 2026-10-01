"use client";

import { useState } from "react";
import { Card, Input, Label } from "@/components/ui";
import { formatMoney, type Currency } from "@/lib/money";

type TaxpayerType = "INDIVIDUAL" | "COMPANY_OR_TRUST";

export function RentalTaxCalculator({
  currency,
  grossIncome,
  recordedExpenses,
  taxpayerType,
}: {
  currency: Currency;
  grossIncome: number;
  recordedExpenses: number;
  taxpayerType: TaxpayerType;
}) {
  // UGX is the only currency with a sensible default threshold — it's a
  // UGX-denominated statutory figure, not a percentage, so it can't be
  // reused as-is for a USD block without a real exchange rate.
  const [threshold, setThreshold] = useState(currency === "UGX" ? 2820000 : 0);
  const [individualRate, setIndividualRate] = useState(12);
  const [expenseCapPercent, setExpenseCapPercent] = useState(50);
  const [corporateRate, setCorporateRate] = useState(30);

  let taxableIncome = 0;
  let tax = 0;

  if (taxpayerType === "INDIVIDUAL") {
    taxableIncome = Math.max(0, grossIncome - threshold);
    tax = (taxableIncome * individualRate) / 100;
  } else {
    const allowableExpenses = Math.min(recordedExpenses, (grossIncome * expenseCapPercent) / 100);
    taxableIncome = Math.max(0, grossIncome - allowableExpenses);
    tax = (taxableIncome * corporateRate) / 100;
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{currency}</p>
        {currency !== "UGX" && (
          <p className="text-xs text-amber-700">URA&apos;s threshold is UGX-denominated — convert first</p>
        )}
      </div>

      {taxpayerType === "INDIVIDUAL" ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`threshold-${currency}`}>Annual threshold ({currency})</Label>
            <Input
              id={`threshold-${currency}`}
              type="number"
              min={0}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor={`rate-${currency}`}>Tax rate (%)</Label>
            <Input
              id={`rate-${currency}`}
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={individualRate}
              onChange={(e) => setIndividualRate(Number(e.target.value) || 0)}
            />
          </div>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`cap-${currency}`}>Expense deduction cap (% of gross)</Label>
            <Input
              id={`cap-${currency}`}
              type="number"
              min={0}
              max={100}
              step={1}
              value={expenseCapPercent}
              onChange={(e) => setExpenseCapPercent(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label htmlFor={`corp-rate-${currency}`}>Corporate tax rate (%)</Label>
            <Input
              id={`corp-rate-${currency}`}
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={corporateRate}
              onChange={(e) => setCorporateRate(Number(e.target.value) || 0)}
            />
          </div>
        </div>
      )}

      <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Taxable rental income</span>
          <span className="font-medium text-slate-900">{formatMoney(taxableIncome, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-slate-700">Estimated tax</span>
          <span className="font-semibold text-ivy-700">{formatMoney(tax, currency)}</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        This is only as accurate as the rate{taxpayerType === "INDIVIDUAL" ? " and threshold" : " and cap"} you
        enter above — the prefilled values are a starting point, not confirmed-current URA figures. Check them
        against URA&apos;s current guidance or your tax advisor before relying on this number.
      </p>
    </Card>
  );
}
