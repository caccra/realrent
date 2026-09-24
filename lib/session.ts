import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

type UserRole = "LANDLORD" | "TENANT" | "CARETAKER" | "PROPERTY_MANAGER" | "ADMIN" | "SUPER_ADMIN";

export async function requireUser(role?: UserRole | UserRole[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  if (!session.user.role) {
    redirect("/onboarding");
  }
  const allowed = Array.isArray(role) ? role : role ? [role] : null;
  if (allowed && !allowed.includes(session.user.role as UserRole)) {
    redirect("/login");
  }
  return session.user;
}

/**
 * Gate a page to internal staff. `minLevel: "SUPER_ADMIN"` restricts it to
 * app owners only; the default "ADMIN" also allows support-tier staff.
 */
export async function requireAdmin(minLevel: "ADMIN" | "SUPER_ADMIN" = "ADMIN") {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    redirect("/login");
  }
  if (minLevel === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
    redirect("/admin/dashboard");
  }
  return session.user;
}
