import { prisma } from "@/lib/prisma";

/**
 * Records a sensitive action for accountability. Never throws — logging
 * must not be able to break the request it's attached to.
 */
export async function logAudit(params: {
  userId: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        targetType: params.targetType ?? null,
        targetId: params.targetId ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch {
    // Never let audit logging fail the underlying request.
  }
}
