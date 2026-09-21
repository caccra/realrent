import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Pick a rating").max(5, "Rating must be 1-5"),
  comment: z.string().trim().max(1000, "Too long").optional().or(z.literal("")),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
export type ReviewFormInput = z.input<typeof reviewSchema>;
