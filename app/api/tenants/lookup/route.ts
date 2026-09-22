import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { getTenantScreeningReport } from "@/lib/data";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "LANDLORD" && session.user.role !== "CARETAKER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const phone = new URL(request.url).searchParams.get("phone");
  const normalized = phone ? normalizePhone(phone) : null;
  if (!normalized) {
    return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 });
  }

  const tenant = await prisma.user.findUnique({ where: { phone: normalized } });
  if (!tenant || tenant.role !== "TENANT") {
    return NextResponse.json({ exists: false });
  }

  const report = await getTenantScreeningReport(tenant.id);
  return NextResponse.json({ exists: true, name: tenant.name, report });
}
