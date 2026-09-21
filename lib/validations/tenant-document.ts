import { z } from "zod";

export const TENANT_DOCUMENT_TYPES = [
  { value: "ID", label: "National ID" },
  { value: "PASSPORT", label: "Passport" },
  { value: "LETTER", label: "Letter" },
  { value: "OTHER", label: "Other" },
] as const;

export const tenantDocumentSchema = z.object({
  type: z.enum(["ID", "PASSPORT", "LETTER", "OTHER"]),
  label: z.string().trim().max(100, "Too long").optional().or(z.literal("")),
});

export type TenantDocumentInput = z.infer<typeof tenantDocumentSchema>;
