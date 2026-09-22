import { prisma } from "@/lib/prisma";

/**
 * A property can be managed by its owning landlord, or by a caretaker the
 * landlord has appointed to it.
 */
export async function canManageProperty(
  userId: string,
  role: string | null | undefined,
  propertyId: string
): Promise<boolean> {
  if (role === "LANDLORD") {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    return property?.landlordId === userId;
  }
  if (role === "CARETAKER") {
    const assignment = await prisma.caretakerAssignment.findUnique({
      where: { propertyId_caretakerId: { propertyId, caretakerId: userId } },
    });
    return !!assignment;
  }
  return false;
}

/**
 * A tenant can be managed (e.g. their documents reviewed) by a landlord or
 * caretaker who has a lease relationship with them on at least one property.
 */
export async function canManageTenant(
  userId: string,
  role: string | null | undefined,
  tenantId: string
): Promise<boolean> {
  if (role === "LANDLORD") {
    const lease = await prisma.lease.findFirst({
      where: { tenantId, unit: { property: { landlordId: userId } } },
    });
    return !!lease;
  }
  if (role === "CARETAKER") {
    const lease = await prisma.lease.findFirst({
      where: { tenantId, unit: { property: { caretakerAssignments: { some: { caretakerId: userId } } } } },
    });
    return !!lease;
  }
  return false;
}
