"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({ className = "text-slate-500 hover:text-slate-900" }: { className?: string }) {
  return (
    <button onClick={() => signOut({ callbackUrl: "/" })} className={className}>
      Sign out
    </button>
  );
}
