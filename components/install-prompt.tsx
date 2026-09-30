"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "kezavi-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // Private browsing / blocked storage — just don't remember the dismissal.
    }
    if (dismissed) return;

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore — worst case the prompt can reappear next visit.
    }
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:inset-x-auto sm:right-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ivy-700">
        <svg viewBox="0 0 64 64" className="h-6 w-6" aria-hidden="true">
          <path d="M17 30L32 17L47 30" fill="none" stroke="#F6F4EE" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="32" cy="36" r="6.5" fill="#E8804A" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">Install Kezavi</p>
        <p className="text-xs text-slate-500">Add it to your home screen for quick, app-like access.</p>
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        <button
          type="button"
          onClick={install}
          className="rounded-md bg-ivy-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-ivy-800"
        >
          Install
        </button>
        <button type="button" onClick={dismiss} className="text-xs text-slate-400 hover:text-slate-600">
          Not now
        </button>
      </div>
    </div>
  );
}
