import { z } from "zod";

export const ADMIN_ASSIGNABLE_ROLES = [
  { value: "LANDLORD", label: "Landlord" },
  { value: "TENANT", label: "Tenant" },
  { value: "CARETAKER", label: "Caretaker" },
  { value: "ADMIN", label: "Admin (support)" },
  { value: "SUPER_ADMIN", label: "Super Admin (owner)" },
] as const;

export const updateUserRoleSchema = z.object({
  role: z.enum(["LANDLORD", "TENANT", "CARETAKER", "ADMIN", "SUPER_ADMIN"]),
});

export const suspendUserSchema = z.object({
  suspended: z.boolean(),
  reason: z.string().trim().max(500, "Too long").optional().or(z.literal("")),
});
