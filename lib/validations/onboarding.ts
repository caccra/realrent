import { z } from "zod";

export const onboardingSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  phone: z.string().trim().min(9, "Enter a valid phone number"),
  role: z.enum(["LANDLORD", "TENANT", "CARETAKER", "PROPERTY_MANAGER"]),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
