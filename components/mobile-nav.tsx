"use client";

import { useState } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { NavLinks } from "@/components/nav-links";

export function MobileNav({ nav, userName }: { nav: { href: string; label: string }[]; userName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 border-b border-slate-200 bg-ivy-900 px-4 py-4 shadow-lg">
          <NavLinks nav={nav} onNavigate={() => setOpen(false)} />
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-ivy-100">
            <span>{userName}</span>
            <SignOutButton className="text-ivy-200 hover:text-white" />
          </div>
        </div>
      )}
    </div>
  );
}
