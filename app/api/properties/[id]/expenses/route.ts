import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validations/expense";
import { canManageProperty } from "@/lib/authorization";
import { isAllowedDocument, uploadExpenseReceipt } from "@/lib/storage";
import { logAudit } from "@/lib/audit-log";
import { withErrorHandling } from "@/lib/api-handler";

export const POST = withErrorHandling(async (request, { params }) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await canManageProperty(session.user.id, session.user.role, id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const body = {
    category: formData.get("category"),
    description: formData.get("description") ?? undefined,
    amount: formData.get("amount"),
    currency: formData.get("currency") ?? "UGX",
    vendor: formData.get("vendor") ?? undefined,
    incurredAt: formData.get("incurredAt"),
  };
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const receiptFile = formData.get("receipt");
  let receiptUrl: string | null = null;
  if (receiptFile instanceof File && receiptFile.size > 0) {
    const error = isAllowedDocument(receiptFile);
    if (error) return NextResponse.json({ error }, { status: 400 });
    receiptUrl = await uploadExpenseReceipt(id, receiptFile);
  }

  const expense = await prisma.expense.create({
    data: {
      propertyId: id,
      category: parsed.data.category,
      description: parsed.data.description || null,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      vendor: parsed.data.vendor || null,
      incurredAt: new Date(parsed.data.incurredAt),
      receiptUrl,
      recordedById: session.user.id,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "expense.record",
    targetType: "Property",
    targetId: id,
    metadata: { expenseId: expense.id, category: expense.category, amount: Number(expense.amount) },
  });

  return NextResponse.json(expense);
});
