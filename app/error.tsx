"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, SecondaryButton } from "@/components/ui";
import { Logo } from "@/components/logo";

// Error boundaries must be Client Components. Next.js 16 renamed the
// recovery callback from `reset` to `retry` — see AGENTS.md.
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="max-w-sm text-center">
        <Logo className="justify-center" />
        <h1 className="mt-4 text-xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">
          We hit an unexpected error loading this page. Please try again — if it keeps happening, let us know.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" onClick={() => retry()}>
            Try again
          </Button>
          <Link href="/">
            <SecondaryButton type="button">Go home</SecondaryButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
