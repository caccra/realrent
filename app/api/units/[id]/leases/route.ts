import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { leaseSchema } from "@/lib/validations/property";
import { findOrCreateUserByPhone } from "@/lib/user-provisioning";
import { firstInvoicePeriod } from "@/lib/invoicing";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unit = await prisma.unit.findUnique({ where: { id }, include: { property: true } });
  if (!unit || unit.property.landlordId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (unit.status === "OCCUPIED") {
    return NextResponse.json({ error: "This unit already has an active lease" }, { status: 409 });
  }

  const body = await request.json();
  const parsed = leaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const provisioned = await findOrCreateUserByPhone(parsed.data.tenantPhone, parsed.data.tenantName, "TENANT");
  if (!provisioned.ok) {
    return NextResponse.json({ error: provisioned.error }, { status: 409 });
  }
  const tenant = provisioned.user;

  const startDate = new Date(parsed.data.startDate);
  const { periodStart, periodEnd, dueDate } = firstInvoicePeriod(startDate, unit.billingCycle);

  const lease = await prisma.$transaction(async (tx) => {
    const created = await tx.lease.create({
      data: {
        unitId: unit.id,
        tenantId: tenant.id,
        startDate,
        rentAmount: parsed.data.rentAmount,
        depositAmount: parsed.data.depositAmount,
        status: "ACTIVE",
      },
    });

    await tx.unit.update({ where: { id: unit.id }, data: { status: "OCCUPIED" } });

    await tx.rentInvoice.create({
      data: {
        leaseId: created.id,
        periodStart,
        periodEnd,
        dueDate,
        amountDue: parsed.data.rentAmount,
      },
    });

    return created;
  });

  return NextResponse.json({
    id: lease.id,
    tenantPhone: tenant.phone,
    tempPassword: provisioned.tempPassword,
  });
}
