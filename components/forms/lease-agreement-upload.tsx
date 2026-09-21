"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SecondaryButton } from "@/components/ui";

export function LeaseAgreementUpload({
  leaseId,
  currentFileUrl,
  currentFileName,
}: {
  leaseId: string;
  currentFileUrl: string | null;
  currentFileName: string | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/leases/${leaseId}/agreement-file`, {
        method: "POST",
        body: formData,
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Upload failed");
        return;
      }
      router.refresh();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-slate-900">Uploaded lease agreement</p>
      {currentFileUrl ? (
        <a
          href={currentFileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          {currentFileName ?? "Download file"} →
        </a>
      ) : (
        <p className="text-sm text-slate-500">No file uploaded yet.</p>
      )}
      <div className="mt-2">
        <SecondaryButton
          type="button"
          className="text-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : currentFileUrl ? "Replace file" : "Upload agreement"}
        </SecondaryButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(e) => handleFileSelected(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
