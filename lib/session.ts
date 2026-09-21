import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function requireUser(role?: "LANDLORD" | "TENANT" | "CARETAKER") {
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
