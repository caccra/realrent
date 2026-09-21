import { z } from "zod";

export const newMessageSchema = z.object({
  body: z.string().trim().min(1, "Message can't be empty").max(2000, "Message is too long"),
});

export type NewMessageInput = z.infer<typeof newMessageSchema>;
