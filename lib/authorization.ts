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
