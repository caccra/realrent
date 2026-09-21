import { z } from "zod";

export const rentChangeSchema = z.object({
  newRentAmount: z.coerce.number().positive("Amount must be greater than 0"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  note: z.string().trim().max(500, "Too long").optional().or(z.literal("")),
});

export type RentChangeInput = z.infer<typeof rentChangeSchema>;
export type RentChangeFormInput = z.input<typeof rentChangeSchema>;
