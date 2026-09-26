"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Badge, Button, Card, Input, Label, SecondaryButton } from "@/components/ui";

type SetupState = { secret: string; qrCodeDataUrl: string } | null;

export function TwoFactorSettings({ enabled, hasPassword }: { enabled: boolean; hasPassword: boolean }) {
  const router = useRouter();
  const [setup, setSetup] = useState<SetupState>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [disabling, setDisabling] = useState(false);
  const [disableValue, setDisableValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function startSetup() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/2fa/setup", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      setSetup(body);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmSetup() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: confirmCode }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      setSetup(null);
      setConfirmCode("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function disable() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hasPassword ? { password: disableValue } : { token: disableValue }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      setDisabling(false);
      setDisableValue("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-900">Two-factor authentication</p>
        <Badge tone={enabled ? "green" : "slate"}>{enabled ? "Enabled" : "Disabled"}</Badge>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Adds a 6-digit code from an authenticator app (like Google Authenticator or Authy) on top of
        your password when logging in.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {!enabled && !setup && (
        <Button className="mt-4" onClick={startSetup} disabled={submitting}>
          {submitting ? "Starting…" : "Enable two-factor authentication"}
        </Button>
      )}

      {setup && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-700">
            Scan this QR code with your authenticator app, or enter the code manually:
          </p>
          <Image src={setup.qrCodeDataUrl} alt="Two-factor QR code" width={160} height={160} unoptimized />
          <p className="font-mono text-xs text-slate-500 break-all">{setup.secret}</p>
          <div>
            <Label htmlFor="confirmCode">Enter the 6-digit code to confirm</Label>
            <Input
              id="confirmCode"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={confirmSetup} disabled={submitting || confirmCode.length !== 6}>
              {submitting ? "Confirming…" : "Confirm and enable"}
            </Button>
            <SecondaryButton onClick={() => setSetup(null)}>Cancel</SecondaryButton>
          </div>
        </div>
      )}

      {enabled && !disabling && (
        <SecondaryButton className="mt-4 text-red-700" onClick={() => setDisabling(true)}>
          Disable two-factor authentication
        </SecondaryButton>
      )}

      {enabled && disabling && (
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="disableValue">{hasPassword ? "Confirm your password" : "Enter your current 6-digit code"}</Label>
            <Input
              id="disableValue"
              type={hasPassword ? "password" : "text"}
              inputMode={hasPassword ? undefined : "numeric"}
              maxLength={hasPassword ? undefined : 6}
              value={disableValue}
              onChange={(e) => setDisableValue(hasPassword ? e.target.value : e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="flex gap-2">
            <Button className="bg-red-700 hover:bg-red-800" onClick={disable} disabled={submitting || !disableValue}>
              {submitting ? "Disabling…" : "Confirm disable"}
            </Button>
            <SecondaryButton onClick={() => setDisabling(false)}>Cancel</SecondaryButton>
          </div>
        </div>
      )}
    </Card>
  );
}
