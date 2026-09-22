import { z } from "zod";

export const PROPERTY_USAGES = [
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
] as const;

export const PROPERTY_LISTING_TYPES = [
  { value: "RENTAL", label: "For rent" },
  { value: "SALE", label: "For sale" },
] as const;

export const RESIDENTIAL_PROPERTY_TYPES = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "HOUSE", label: "Standalone House" },
  { value: "HOSTEL", label: "Hostel / Bedsitter" },
  { value: "SHELL_HOUSE", label: "Shell House" },
  { value: "SEMI_DETACHED", label: "Semi Detached" },
  { value: "STOREYED_BUILDING", label: "Storeyed Building" },
  { value: "STUDIO_ROOM", label: "Studio Room" },
  { value: "MANSION", label: "Mansion" },
  { value: "DUPLEX", label: "Duplex" },
  { value: "BUNGALOW", label: "Bungalow" },
] as const;

export const COMMERCIAL_PROPERTY_TYPES = [
  { value: "STANDALONE", label: "Standalone Building" },
  { value: "SHELL_HOUSE", label: "Shell House" },
  { value: "STOREYED_BUILDING", label: "Storeyed Building" },
  { value: "MALL", label: "Mall" },
  { value: "ARCADE", label: "Arcade" },
  { value: "RENTAL_UNITS", label: "Rental Units" },
] as const;

// Combined list for places that need to display a type's label regardless of usage.
export const PROPERTY_TYPES = [
  ...RESIDENTIAL_PROPERTY_TYPES,
  ...COMMERCIAL_PROPERTY_TYPES.filter(
    (t) => !RESIDENTIAL_PROPERTY_TYPES.some((r) => r.value === t.value)
  ),
];

export const RESIDENTIAL_AMENITIES = [
  "Parking",
  "Water tank",
  "Security",
  "Generator",
  "Furnished",
  "Compound",
  "Fenced compound",
  "Internet",
  "Borehole",
  "Air Conditioning",
  "CCTV cameras",
  "Garbage Collection",
  "Property cleaning",
  "Balcony",
  "Swimming pool",
  "Garden",
  "Gym",
  "Games room",
] as const;

export const COMMERCIAL_AMENITIES = [
  "Security",
  "Parking",
  "Water tank",
  "Elevator",
  "Generator",
  "Garden",
  "Compound",
  "Garbage Collection",
  "Property cleaning",
  "CCTV cameras",
  "Air Conditioning",
  "Internet",
] as const;

export const propertySchema = z
  .object({
    name: z.string().trim().min(2, "Property name is too short"),
    address: z.string().trim().min(3, "Address is too short"),
    location: z.string().trim().max(120, "Location is too long").optional().or(z.literal("")),
    description: z.string().trim().max(2000, "Description is too long").optional().or(z.literal("")),
    usage: z.enum(["RESIDENTIAL", "COMMERCIAL"]).optional().or(z.literal("")),
    propertyType: z
      .enum([
        "APARTMENT",
        "HOUSE",
        "HOSTEL",
        "SHELL_HOUSE",
        "SEMI_DETACHED",
        "STOREYED_BUILDING",
        "STUDIO_ROOM",
        "MANSION",
        "DUPLEX",
        "BUNGALOW",
        "STANDALONE",
        "MALL",
        "ARCADE",
        "RENTAL_UNITS",
      ])
      .optional()
      .or(z.literal("")),
    amenities: z.array(z.string()).default([]),
    listingType: z.enum(["RENTAL", "SALE"]).default("RENTAL"),
    salePrice: z.coerce.number().positive("Sale price must be greater than 0").optional(),
    saleBedrooms: z.coerce.number().int().min(0).max(20).optional(),
    saleBathrooms: z.coerce.number().int().min(0).max(20).optional(),
  })
  .refine((data) => data.listingType !== "SALE" || data.salePrice != null, {
    message: "Enter a sale price",
    path: ["salePrice"],
  });

export type PropertyInput = z.infer<typeof propertySchema>;
export type PropertyFormInput = z.input<typeof propertySchema>;

export const unitSchema = z.object({
  label: z.string().trim().min(1, "Unit label is required"),
  bedrooms: z.coerce.number().int().min(0).max(20),
  bathrooms: z.coerce.number().int().min(0).max(20).optional(),
  otherRooms: z.string().trim().max(200, "Too long").optional().or(z.literal("")),
  rentAmount: z.coerce.number().positive("Rent must be greater than 0"),
  billingCycle: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]).default("MONTHLY"),
  floor: z.string().trim().max(50, "Too long").optional().or(z.literal("")),
  shopNumber: z.string().trim().max(50, "Too long").optional().or(z.literal("")),
  dimensions: z.string().trim().max(50, "Too long").optional().or(z.literal("")),
});

export type UnitInput = z.infer<typeof unitSchema>;
export type UnitFormInput = z.input<typeof unitSchema>;

export const leaseSchema = z.object({
  unitId: z.string().min(1),
  tenantName: z.string().trim().min(2, "Tenant name is too short"),
  tenantPhone: z.string().trim().min(9, "Enter a valid phone number"),
  startDate: z.string().min(1, "Start date is required"),
  rentAmount: z.coerce.number().positive("Rent must be greater than 0"),
  depositAmount: z.coerce.number().min(0, "Deposit cannot be negative"),
});

export type LeaseInput = z.infer<typeof leaseSchema>;
export type LeaseFormInput = z.input<typeof leaseSchema>;

export const cashPaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
});

export type CashPaymentInput = z.infer<typeof cashPaymentSchema>;
export type CashPaymentFormInput = z.input<typeof cashPaymentSchema>;

export const appointCaretakerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  phone: z.string().trim().min(9, "Enter a valid phone number"),
});

export type AppointCaretakerInput = z.infer<typeof appointCaretakerSchema>;

export const propertyInquirySchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  phone: z.string().trim().min(9, "Enter a valid phone number"),
  email: z.string().trim().email().optional().or(z.literal("")),
  message: z.string().trim().min(5, "Message is too short").max(1000, "Message is too long"),
});

export type PropertyInquiryInput = z.infer<typeof propertyInquirySchema>;
