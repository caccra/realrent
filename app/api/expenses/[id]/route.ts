import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageProperty } from "@/lib/authorization";
import { deleteExpenseReceiptFile } from "@/lib/storage";
import { logAudit } from "@/lib/audit-log";
import { withErrorHandling } from "@/lib/api-handler";

export const DELETE = withErrorHandling(async (_request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense || !(await canManageProperty(session.user.id, session.user.role, expense.propertyId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.expense.delete({ where: { id } });
  if (expense.receiptUrl) {
    await deleteExpenseReceiptFile(expense.receiptUrl);
  }

  await logAudit({
    userId: session.user.id,
    action: "expense.delete",
    targetType: "Property",
    targetId: expense.propertyId,
    metadata: { expenseId: id, category: expense.category, amount: Number(expense.amount) },
  });

  return NextResponse.json({ ok: true });
});
