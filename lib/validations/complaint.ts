import { z } from "zod";

export const complaintSchema = z.object({
  title: z.string().trim().min(2, "Title is too short").max(150, "Title is too long"),
  description: z.string().trim().min(5, "Description is too short").max(2000, "Description is too long"),
});

export type ComplaintInput = z.infer<typeof complaintSchema>;

export const complaintUpdateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
  resolutionNote: z.string().trim().max(2000, "Too long").optional().or(z.literal("")),
});

export type ComplaintUpdateInput = z.infer<typeof complaintUpdateSchema>;
