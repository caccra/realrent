"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function AdminDeleteUserButton({ userId, name }: { userId: string; name: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!confirm(`Permanently delete ${name}'s account? This cannot be undone.`)) return;

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      router.push("/admin/users");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Button onClick={handleClick} disabled={submitting} className="bg-red-700 hover:bg-red-800">
        {submitting ? "Deleting…" : "Delete account"}
      </Button>
      {error && <p className="mt-2 max-w-sm text-sm text-red-600">{error}</p>}
    </div>
  );
}
