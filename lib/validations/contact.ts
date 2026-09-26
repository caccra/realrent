import { z } from "zod";

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().max(20, "Too long").optional().or(z.literal("")),
  subject: z.string().trim().min(3, "Subject is too short").max(200, "Too long"),
  message: z.string().trim().min(10, "Tell us a bit more").max(2000, "Too long"),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
