import { NextResponse } from "next/server";
import { runRentCycle } from "@/lib/rent-cycle";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async (request) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }

  const provided =
    request.headers.get("x-cron-secret") ?? new URL(request.url).searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runRentCycle();
  return NextResponse.json(results);
});
