import { z } from "zod";

export const endLeaseSchema = z.object({
  depositDeductions: z.coerce.number().min(0).optional(),
  depositDeductionNote: z.string().trim().max(500, "Too long").optional().or(z.literal("")),
  markRefunded: z.boolean().optional(),
});

export type EndLeaseInput = z.infer<typeof endLeaseSchema>;
export type EndLeaseFormInput = z.input<typeof endLeaseSchema>;
