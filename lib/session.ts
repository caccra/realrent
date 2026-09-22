import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function requireUser(role?: "LANDLORD" | "TENANT" | "CARETAKER" | "ADMIN" | "SUPER_ADMIN") {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  if (!session.user.role) {
    redirect("/onboarding");
  }
  if (role && session.user.role !== role) {
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
