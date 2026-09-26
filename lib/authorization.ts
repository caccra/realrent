import { prisma } from "@/lib/prisma";

/**
 * A property can be managed by its owning landlord, by a property manager
 * the landlord has appointed to it (full landlord-equivalent access), by a
 * caretaker the landlord has appointed to it (operational access only), or
 * unconditionally by a super admin (platform-wide override for support).
 * A regular (non-super) admin does NOT get this bypass — their access stays
 * scoped to the dedicated /admin support tooling (complaints, maintenance).
 */
export async function canManageProperty(
  userId: string,
  role: string | null | undefined,
  propertyId: string
): Promise<boolean> {
  if (role === "SUPER_ADMIN") {
    return true;
  }
  if (role === "LANDLORD") {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    return property?.landlordId === userId;
  }
  if (role === "PROPERTY_MANAGER") {
    const assignment = await prisma.propertyManagerAssignment.findUnique({
      where: { propertyId_managerId: { propertyId, managerId: userId } },
    });
    return !!assignment;
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
 * A tenant can be managed (e.g. their documents reviewed) by a landlord,
 * property manager, or caretaker who has a lease relationship with them on
 * at least one property.
 */
export async function canManageTenant(
  userId: string,
  role: string | null | undefined,
  tenantId: string
): Promise<boolean> {
  if (role === "SUPER_ADMIN") {
    return true;
  }
  if (role === "LANDLORD") {
    const lease = await prisma.lease.findFirst({
      where: { tenantId, unit: { property: { landlordId: userId } } },
    });
    return !!lease;
  }
  if (role === "PROPERTY_MANAGER") {
    const lease = await prisma.lease.findFirst({
      where: { tenantId, unit: { property: { propertyManagerAssignments: { some: { managerId: userId } } } } },
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

/**
 * Property IDs a user can act on as an owner (landlord) or an appointed
 * property manager. Used to scope bulk listing/aggregate queries the same
 * way canManageProperty scopes single-property checks.
 */
export async function getManagedPropertyIds(userId: string, role: string | null | undefined): Promise<string[]> {
  if (role === "LANDLORD") {
    const properties = await prisma.property.findMany({ where: { landlordId: userId }, select: { id: true } });
    return properties.map((p) => p.id);
  }
  if (role === "PROPERTY_MANAGER") {
    const assignments = await prisma.propertyManagerAssignment.findMany({
      where: { managerId: userId },
      select: { propertyId: true },
    });
    return assignments.map((a) => a.propertyId);
  }
  return [];
}
