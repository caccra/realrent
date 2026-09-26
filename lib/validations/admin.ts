import { z } from "zod";

export const ADMIN_ASSIGNABLE_ROLES = [
  { value: "LANDLORD", label: "Landlord" },
  { value: "TENANT", label: "Tenant" },
  { value: "PROPERTY_MANAGER", label: "Property manager" },
  { value: "CARETAKER", label: "Caretaker" },
  { value: "ADMIN", label: "Admin (support)" },
  { value: "SUPER_ADMIN", label: "Super Admin (owner)" },
] as const;

export const updateUserRoleSchema = z.object({
  role: z.enum(["LANDLORD", "TENANT", "PROPERTY_MANAGER", "CARETAKER", "ADMIN", "SUPER_ADMIN"]),
});

export const suspendUserSchema = z.object({
  suspended: z.boolean(),
  reason: z.string().trim().max(500, "Too long").optional().or(z.literal("")),
});

// Roles a regular (non-super) admin may create directly. A super admin may
// additionally create PROPERTY_MANAGER, CARETAKER, and ADMIN accounts —
// SUPER_ADMIN itself stays out of this list on purpose, so promoting someone
// that far always goes through the explicit role-change form as a second,
// deliberate step.
export const ADMIN_CREATABLE_ROLES = [
  { value: "LANDLORD", label: "Landlord" },
  { value: "TENANT", label: "Tenant" },
] as const;

export const SUPER_ADMIN_CREATABLE_ROLES = [
  ...ADMIN_CREATABLE_ROLES,
  { value: "PROPERTY_MANAGER", label: "Property manager" },
  { value: "CARETAKER", label: "Caretaker" },
  { value: "ADMIN", label: "Admin (support)" },
] as const;

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  phone: z.string().trim().min(9, "Enter a valid phone number"),
  email: z.string().trim().email().optional().or(z.literal("")),
  role: z.enum(["LANDLORD", "TENANT", "PROPERTY_MANAGER", "CARETAKER", "ADMIN"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserProfileSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  phone: z.string().trim().min(9, "Enter a valid phone number"),
  email: z.string().trim().email().optional().or(z.literal("")),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
