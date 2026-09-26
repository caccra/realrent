import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

export const whatsappNumberSchema = z.object({
  whatsappNumber: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || normalizePhone(value) !== null, {
      message: "Enter a valid phone number starting with the country code, e.g. 0771234567 or +256771234567",
    }),
});

export type WhatsAppNumberInput = z.infer<typeof whatsappNumberSchema>;
