"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_INSPECTION_CHECKLIST,
  INSPECTION_CONDITIONS,
  type InspectionItemInput,
} from "@/lib/validations/inspection";
import { Button, Card, Label, Select, SecondaryButton, Textarea } from "@/components/ui";

const MAX_PHOTOS = 12;

export function NewInspectionForm({
  leaseId,
  availableTypes,
}: {
  leaseId: string;
  availableTypes: readonly { value: string; label: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(availableTypes[0]?.value ?? "MOVE_IN");
  const [items, setItems] = useState<InspectionItemInput[]>(
    DEFAULT_INSPECTION_CHECKLIST.map((label) => ({ label, condition: "GOOD", note: "" }))
  );
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (availableTypes.length === 0) return null;

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="mb-4">
        New inspection
      </Button>
    );
  }

  function updateItem(index: number, patch: Partial<InspectionItemInput>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function handleFilesSelected(selected: FileList | null) {
    if (!selected) return;
    setFiles((prev) => [...prev, ...Array.from(selected)].slice(0, MAX_PHOTOS));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit() {
    setServerError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("notes", notes);
      formData.append("items", JSON.stringify(items));
      files.forEach((file) => formData.append("files", file));

      const res = await fetch(`/api/leases/${leaseId}/inspections`, { method: "POST", body: formData });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mb-4">
      <h2 className="mb-3 text-sm font-medium text-slate-900">New inspection</h2>

      <div className="mb-4">
        <Label htmlFor="inspectionType">Type</Label>
        <Select id="inspectionType" value={type} onChange={(e) => setType(e.target.value)}>
          {availableTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="flex-1 text-sm text-slate-700">{item.label}</span>
            <Select
              className="w-28"
              value={item.condition}
              onChange={(e) => updateItem(i, { condition: e.target.value as InspectionItemInput["condition"] })}
            >
              {INSPECTION_CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <Label htmlFor="inspectionNotes">Overall notes (optional)</Label>
        <Textarea id="inspectionNotes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="mt-3">
        <Label>Photos (optional)</Label>
        <SecondaryButton
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={files.length >= MAX_PHOTOS}
        >
          Add photos
        </SecondaryButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          hidden
          onChange={(e) => handleFilesSelected(e.target.files)}
        />
        {files.length > 0 && (
          <p className="mt-1 text-xs text-slate-500">{files.length} photo(s) selected</p>
        )}
      </div>

      {serverError && <p className="mt-3 text-sm text-red-600">{serverError}</p>}

      <div className="mt-4 flex gap-2">
        <Button type="button" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Saving…" : "Save inspection"}
        </Button>
        <SecondaryButton type="button" onClick={() => setOpen(false)}>
          Cancel
        </SecondaryButton>
      </div>
    </Card>
  );
}
