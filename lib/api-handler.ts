import { NextResponse } from "next/server";

type RouteContext = { params: Promise<Record<string, string>> };
type RouteHandler = (request: Request, context: RouteContext) => Promise<Response>;

/**
 * Wraps an API route handler so an unexpected exception (a Prisma error, a
 * malformed request body, a failed upstream call) returns a plain JSON 500
 * instead of Next.js's default unstyled crash page. Handlers should still
 * return their own typed error responses (401/404/409/400) for conditions
 * they anticipate — this is only the safety net underneath that.
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error(`[api] Unhandled error in ${request.method} ${new URL(request.url).pathname}:`, error);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

/** Parses a request body as JSON, returning {} on malformed/empty input instead of throwing. */
export async function readJsonBody(request: Request): Promise<unknown> {
  return request.json().catch(() => ({}));
}
