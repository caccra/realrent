// One-off bootstrap script: promote an existing account to ADMIN or SUPER_ADMIN.
// There's no self-service way to become an admin (by design), so the very
// first super admin has to be created this way. After that, a super admin
// can promote further staff from the /admin/users dashboard.
//
// Usage:
//   node scripts/promote-admin.mjs <phone> <ADMIN|SUPER_ADMIN>
//
// Example:
//   node scripts/promote-admin.mjs 0771234567 SUPER_ADMIN
//
// Run this against whichever database DATABASE_URL (in your .env) points
// at — load your production .env first if you're bootstrapping prod.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function normalizePhone(raw) {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("256") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return "256" + digits.slice(1);
  if (digits.length === 9) return "256" + digits;
  return null;
}

async function main() {
  const [, , rawPhone, rawRole] = process.argv;
  const role = (rawRole ?? "").toUpperCase();

  if (!rawPhone || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    console.error("Usage: node scripts/promote-admin.mjs <phone> <ADMIN|SUPER_ADMIN>");
    process.exit(1);
  }

  const phone = normalizePhone(rawPhone);
  if (!phone) {
    console.error(`"${rawPhone}" doesn't look like a valid phone number.`);
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    console.error(`No account found for ${phone}. Register the account first, then run this script.`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data: { role } });
  console.log(`${updated.name} (${updated.phone}) is now ${role}.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
