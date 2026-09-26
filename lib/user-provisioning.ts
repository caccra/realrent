import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";

function generateTempPassword(): string {
  return crypto.randomBytes(6).toString("base64url");
}

type ProvisionResult =
  | {
      ok: true;
      user: { id: string; name: string; phone: string | null; email: string | null };
      tempPassword: string | null;
    }
  | { ok: false; error: string };

/**
 * Finds an existing user by phone with the given role, or creates one with a
 * generated temporary password. Used when a landlord names a tenant,
 * caretaker, or property manager by phone number who may not have an
 * account yet.
 */
export async function findOrCreateUserByPhone(
  rawPhone: string,
  name: string,
  role: "TENANT" | "CARETAKER" | "PROPERTY_MANAGER"
): Promise<ProvisionResult> {
  const normalizedPhone = normalizePhone(rawPhone);
  if (!normalizedPhone) {
    return { ok: false, error: "Enter a valid phone number" };
  }

  const existing = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
  if (existing && existing.role !== role) {
    return {
      ok: false,
      error: `This phone number is already registered as a ${existing.role?.toLowerCase() ?? "different"} account`,
    };
  }
  if (existing) {
    return { ok: true, user: existing, tempPassword: null };
  }

  const tempPassword = generateTempPassword();
  const user = await prisma.user.create({
    data: {
      name,
      phone: normalizedPhone,
      passwordHash: await bcrypt.hash(tempPassword, 10),
      role,
    },
  });

  return { ok: true, user, tempPassword };
}
