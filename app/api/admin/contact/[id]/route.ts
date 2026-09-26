import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandling, readJsonBody } from "@/lib/api-handler";

export const PATCH = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await readJsonBody(request)) as { action?: string };
  if (body.action !== "resolve") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const updated = await prisma.contactMessage.update({
    where: { id },
    data: { status: message.status === "RESOLVED" ? "NEW" : "RESOLVED" },
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
});
