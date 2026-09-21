import { z } from "zod";

export const LATE_FEE_TYPES = [
  { value: "FLAT", label: "Flat amount (UGX)" },
  { value: "PERCENT", label: "Percent of rent" },
] as const;

export const lateFeePolicySchema = z
  .object({
    lateFeeEnabled: z.boolean().default(false),
    lateFeeType: z.enum(["FLAT", "PERCENT"]).optional().or(z.literal("")),
    lateFeeValue: z.coerce.number().min(0).optional(),
    lateFeeGraceDays: z.coerce.number().int().min(0).max(60).optional(),
  })
  .refine((data) => !data.lateFeeEnabled || !!data.lateFeeType, {
    message: "Choose a late fee type",
    path: ["lateFeeType"],
  })
  .refine((data) => !data.lateFeeEnabled || (data.lateFeeValue != null && data.lateFeeValue > 0), {
    message: "Enter a late fee amount",
    path: ["lateFeeValue"],
  });

export type LateFeePolicyInput = z.infer<typeof lateFeePolicySchema>;
export type LateFeePolicyFormInput = z.input<typeof lateFeePolicySchema>;
