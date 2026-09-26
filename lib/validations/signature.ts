import { z } from "zod";

export const signLeaseSchema = z.object({
  typedName: z.string().trim().min(2, "Type your full legal name"),
  consent: z.literal(true, "You must confirm this typed name is your signature"),
});

export type SignLeaseInput = z.infer<typeof signLeaseSchema>;
