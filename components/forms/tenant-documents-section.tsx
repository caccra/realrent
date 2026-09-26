"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TENANT_DOCUMENT_TYPES } from "@/lib/validations/tenant-document";
import { Badge, Button, Card, Input, Label, Select, SecondaryButton } from "@/components/ui";

type TenantDocument = {
  id: string;
  type: string;
  label: string | null;
  url: string;
  fileName: string;
  createdAt: Date | string;
  verified: boolean;
};

export function TenantDocumentsSection({ documents }: { documents: TenantDocument[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState("ID");
  const [label, setLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("label", label);
      formData.append("file", file);
      const res = await fetch("/api/documents", { method: "POST", body: formData });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Upload failed");
        return;
      }
      setLabel("");
      router.refresh();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card className="mb-4">
      <p className="mb-3 text-sm font-medium text-slate-900">My documents</p>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <Label htmlFor="docType">Type</Label>
          <Select id="docType" value={type} onChange={(e) => setType(e.target.value)}>
            {TENANT_DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="docLabel">Label (optional)</Label>
          <Input
            id="docLabel"
            placeholder="e.g. National ID front"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploading…" : "Upload document"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={(e) => handleFileSelected(e.target.files?.[0])}
          />
        </div>
      </div>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      {documents.length === 0 ? (
        <p className="text-sm text-slate-500">No documents uploaded yet.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-ivy-700 hover:text-ivy-800"
                >
                  {TENANT_DOCUMENT_TYPES.find((t) => t.value === doc.type)?.label ?? doc.type}
                  {doc.label && ` — ${doc.label}`}
                </a>
                <Badge tone={doc.verified ? "green" : "slate"}>{doc.verified ? "Verified" : "Unverified"}</Badge>
              </span>
              <SecondaryButton
                className="text-xs text-red-700"
                onClick={() => handleDelete(doc.id)}
                disabled={deletingId === doc.id}
              >
                {deletingId === doc.id ? "Removing…" : "Remove"}
              </SecondaryButton>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
