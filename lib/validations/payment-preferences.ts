import { z } from "zod";

export const MOMO_PROVIDERS = [
  { value: "MTN", label: "MTN Mobile Money" },
  { value: "AIRTEL", label: "Airtel Money" },
] as const;

export const paymentPreferencesSchema = z
  .object({
    acceptsCash: z.boolean().default(true),
    acceptsMobileMoney: z.boolean().default(false),
    momoProvider: z.enum(["MTN", "AIRTEL"]).optional().or(z.literal("")),
    momoNumber: z.string().trim().max(20, "Too long").optional().or(z.literal("")),
    acceptsBankTransfer: z.boolean().default(false),
    bankName: z.string().trim().max(100, "Too long").optional().or(z.literal("")),
    bankAccountName: z.string().trim().max(100, "Too long").optional().or(z.literal("")),
    bankAccountNumber: z.string().trim().max(50, "Too long").optional().or(z.literal("")),
  })
  .refine((data) => !data.acceptsMobileMoney || !!data.momoNumber, {
    message: "Enter a Mobile Money number",
    path: ["momoNumber"],
  })
  .refine((data) => !data.acceptsMobileMoney || !!data.momoProvider, {
    message: "Select a Mobile Money provider",
    path: ["momoProvider"],
  })
  .refine((data) => !data.acceptsBankTransfer || !!data.bankAccountNumber, {
    message: "Enter a bank account number",
    path: ["bankAccountNumber"],
  })
  .refine((data) => !data.acceptsBankTransfer || !!data.bankName, {
    message: "Enter a bank name",
    path: ["bankName"],
  });

export type PaymentPreferencesInput = z.infer<typeof paymentPreferencesSchema>;
export type PaymentPreferencesFormInput = z.input<typeof paymentPreferencesSchema>;
