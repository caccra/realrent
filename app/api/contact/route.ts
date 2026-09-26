import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactMessageSchema } from "@/lib/validations/contact";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { emailLayout, sendEmail } from "@/lib/email";
import { withErrorHandling, readJsonBody } from "@/lib/api-handler";

export const POST = withErrorHandling(async (request) => {
  const allowed = await checkRateLimit(`contact:${getClientIp(request)}`, 5, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many messages sent. Try again later." }, { status: 429 });
  }

  const body = await readJsonBody(request);
  const parsed = contactMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const contactMessage = await prisma.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject,
      message: parsed.data.message,
    },
  });

  const superAdmins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN", email: { not: null } },
    select: { email: true },
  });
  await Promise.all(
    superAdmins.map((admin) =>
      sendEmail({
        to: admin.email,
        subject: `New contact message: ${parsed.data.subject}`,
        html: emailLayout(
          "New contact message",
          `<p><strong>${parsed.data.name}</strong> (${parsed.data.email}${parsed.data.phone ? `, ${parsed.data.phone}` : ""})</p>
           <p><strong>${parsed.data.subject}</strong></p>
           <p>${parsed.data.message.replace(/\n/g, "<br />")}</p>`,
          "/admin/contact",
          "View in admin"
        ),
      })
    )
  );

  return NextResponse.json({ ok: true, id: contactMessage.id });
});
