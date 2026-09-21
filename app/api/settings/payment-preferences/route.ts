import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentPreferencesSchema } from "@/lib/validations/payment-preferences";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = paymentPreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      acceptsCash: parsed.data.acceptsCash,
      acceptsMobileMoney: parsed.data.acceptsMobileMoney,
      momoProvider: parsed.data.acceptsMobileMoney ? parsed.data.momoProvider || null : null,
      momoNumber: parsed.data.acceptsMobileMoney ? parsed.data.momoNumber || null : null,
      acceptsBankTransfer: parsed.data.acceptsBankTransfer,
      bankName: parsed.data.acceptsBankTransfer ? parsed.data.bankName || null : null,
      bankAccountName: parsed.data.acceptsBankTransfer ? parsed.data.bankAccountName || null : null,
      bankAccountNumber: parsed.data.acceptsBankTransfer ? parsed.data.bankAccountNumber || null : null,
    },
  });

  return NextResponse.json({ ok: true, updated });
}
