import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  { value: "UTILITIES", label: "Utilities" },
  { value: "STAFF", label: "Staff" },
  { value: "TAXES", label: "Taxes" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "MANAGEMENT_FEE", label: "Management fee" },
  { value: "OTHER", label: "Other" },
] as const;

export const expenseSchema = z.object({
  category: z.enum(["UTILITIES", "STAFF", "TAXES", "INSURANCE", "MANAGEMENT_FEE", "OTHER"]),
  description: z.string().trim().max(500, "Too long").optional().or(z.literal("")),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.enum(["UGX", "USD"]).default("UGX"),
  vendor: z.string().trim().max(200, "Too long").optional().or(z.literal("")),
  incurredAt: z.string().min(1, "Date is required"),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
export type ExpenseFormInput = z.input<typeof expenseSchema>;
