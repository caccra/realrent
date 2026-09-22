import { prisma } from "@/lib/prisma";

/**
 * Simple DB-backed sliding-window rate limiter. Works across serverless
 * function instances (unlike an in-memory counter) since it reads/writes
 * through the shared database. Returns false once `maxAttempts` have been
 * recorded for `key` within the trailing `windowMinutes`.
 */
export async function checkRateLimit(key: string, maxAttempts: number, windowMinutes: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  const count = await prisma.rateLimitAttempt.count({
    where: { key, createdAt: { gte: windowStart } },
  });

  if (count >= maxAttempts) {
    return false;
  }

  await prisma.rateLimitAttempt.create({ data: { key } });

  // Opportunistically sweep this key's old rows so the table doesn't grow unbounded.
  await prisma.rateLimitAttempt.deleteMany({ where: { key, createdAt: { lt: windowStart } } }).catch(() => {});

  return true;
}

/** Best-effort client IP from standard proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
