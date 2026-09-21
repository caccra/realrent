import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageProperty } from "@/lib/authorization";
import { newMessageSchema } from "@/lib/validations/message";

async function loadAuthorizedLease(leaseId: string, userId: string, role: string | null | undefined) {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    include: { unit: { include: { property: { include: { caretakerAssignments: true } } } } },
  });
  if (!lease) return null;

  const authorized =
    role === "TENANT" ? lease.tenantId === userId : await canManageProperty(userId, role, lease.unit.propertyId);

  return authorized ? lease : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lease = await loadAuthorizedLease(id, session.user.id, session.user.role);
  if (!lease) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { leaseId: id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { name: true, role: true } } },
      },
    },
  });

  if (conversation) {
    await prisma.message.updateMany({
      where: { conversationId: conversation.id, senderId: { not: session.user.id }, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return NextResponse.json({ messages: conversation?.messages ?? [] });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lease = await loadAuthorizedLease(id, session.user.id, session.user.role);
  if (!lease) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = newMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const conversation = await prisma.conversation.upsert({
    where: { leaseId: id },
    create: { leaseId: id },
    update: {},
  });

  const created = await prisma.message.create({
    data: { conversationId: conversation.id, senderId: session.user.id, body: parsed.data.body },
    include: { sender: { select: { name: true, role: true } } },
  });

  const preview = `${session.user.name}: ${parsed.data.body.slice(0, 80)}`;
  const notifications =
    session.user.role === "TENANT"
      ? [
          {
            userId: lease.unit.property.landlordId,
            type: "NEW_MESSAGE" as const,
            title: "New message",
            message: preview,
            link: `/landlord/leases/${id}`,
          },
          ...lease.unit.property.caretakerAssignments.map((a) => ({
            userId: a.caretakerId,
            type: "NEW_MESSAGE" as const,
            title: "New message",
            message: preview,
            link: `/caretaker/leases/${id}`,
          })),
        ]
      : [
          {
            userId: lease.tenantId,
            type: "NEW_MESSAGE" as const,
            title: "New message",
            message: preview,
            link: "/tenant/dashboard",
          },
        ];

  await prisma.notification.createMany({ data: notifications });

  return NextResponse.json(created);
}
