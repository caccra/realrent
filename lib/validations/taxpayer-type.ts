import { z } from "zod";

export const TAXPAYER_TYPES = [
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "COMPANY_OR_TRUST", label: "Company or trust" },
] as const;

export const taxpayerTypeSchema = z.object({
  taxpayerType: z.enum(["INDIVIDUAL", "COMPANY_OR_TRUST"]),
});

export type TaxpayerTypeInput = z.infer<typeof taxpayerTypeSchema>;
