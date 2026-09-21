import { z } from "zod";

export const MAINTENANCE_PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

export const MAINTENANCE_STATUSES = [
  { value: "OPEN", label: "Open" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export const newMaintenanceRequestSchema = z.object({
  propertyId: z.string().min(1, "Choose a property"),
  unitId: z.string().optional().or(z.literal("")),
  title: z.string().trim().min(2, "Title is too short"),
  description: z.string().trim().max(2000, "Too long").optional().or(z.literal("")),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  scheduledDate: z.string().optional().or(z.literal("")),
  vendor: z.string().trim().max(120, "Too long").optional().or(z.literal("")),
  cost: z.coerce.number().min(0).optional(),
});

export type NewMaintenanceRequestInput = z.infer<typeof newMaintenanceRequestSchema>;
export type NewMaintenanceRequestFormInput = z.input<typeof newMaintenanceRequestSchema>;

export const maintenanceUpdateSchema = z.object({
  status: z.enum(["OPEN", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  scheduledDate: z.string().optional().or(z.literal("")),
  vendor: z.string().trim().max(120, "Too long").optional().or(z.literal("")),
  cost: z.coerce.number().min(0).optional(),
});

export type MaintenanceUpdateInput = z.infer<typeof maintenanceUpdateSchema>;
export type MaintenanceUpdateFormInput = z.input<typeof maintenanceUpdateSchema>;
