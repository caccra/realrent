import { z } from "zod";

export const INSPECTION_TYPES = [
  { value: "MOVE_IN", label: "Move-in" },
  { value: "MOVE_OUT", label: "Move-out" },
] as const;

export const INSPECTION_CONDITIONS = [
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
] as const;

export const DEFAULT_INSPECTION_CHECKLIST = [
  "Living room — Walls",
  "Living room — Floor",
  "Living room — Windows",
  "Kitchen — Walls",
  "Kitchen — Floor",
  "Kitchen — Sink & plumbing",
  "Kitchen — Cabinets",
  "Kitchen — Electrical",
  "Bedroom — Walls",
  "Bedroom — Floor",
  "Bedroom — Windows & doors",
  "Bathroom — Walls",
  "Bathroom — Plumbing",
  "Bathroom — Fixtures",
  "Doors & locks",
  "Electrical & lighting",
  "General cleanliness",
] as const;

export const inspectionItemSchema = z.object({
  label: z.string().trim().min(1),
  condition: z.enum(["GOOD", "FAIR", "POOR"]),
  note: z.string().trim().max(300, "Too long").optional().or(z.literal("")),
});

export const inspectionSchema = z.object({
  type: z.enum(["MOVE_IN", "MOVE_OUT"]),
  notes: z.string().trim().max(2000, "Too long").optional().or(z.literal("")),
  items: z.array(inspectionItemSchema).min(1, "Add at least one checklist item"),
});

export type InspectionItemInput = z.infer<typeof inspectionItemSchema>;
export type InspectionInput = z.infer<typeof inspectionSchema>;
