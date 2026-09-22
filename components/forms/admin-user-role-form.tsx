"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_ASSIGNABLE_ROLES } from "@/lib/validations/admin";
import { Button, Select } from "@/components/ui";

export function AdminUserRoleForm({ userId, currentRole }: { userId: string; currentRole: string }) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (role === currentRole) return;
    if (!confirm(`Change this user's role to ${role}?`)) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-role", role }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-end gap-2">
      <div>
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          {ADMIN_ASSIGNABLE_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </div>
      <Button type="button" onClick={handleSave} disabled={submitting || role === currentRole} className="text-sm">
        {submitting ? "Saving…" : "Save role"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
