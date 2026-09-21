"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { complaintSchema, type ComplaintInput } from "@/lib/validations/complaint";
import { Button, FieldError, Input, Label, SecondaryButton, Textarea } from "@/components/ui";

const MAX_IMAGES = 6;

export function NewComplaintForm({ leaseId }: { leaseId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ComplaintInput>({ resolver: zodResolver(complaintSchema) });

  if (!open) {
    return (
      <SecondaryButton onClick={() => setOpen(true)} className="text-sm">
        Report an issue
      </SecondaryButton>
    );
  }

  function handleFilesSelected(selected: FileList | null) {
    if (!selected) return;
    const next = [...files, ...Array.from(selected)].slice(0, MAX_IMAGES);
    setFiles(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(data: ComplaintInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      files.forEach((file) => formData.append("files", file));

      const res = await fetch(`/api/leases/${leaseId}/complaints`, {
        method: "POST",
        body: formData,
      });
      const body = await res.json();
      if (!res.ok) {
        setServerError(body.error ?? "Something went wrong");
        return;
      }
      reset();
      setFiles([]);
      setOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="Leaking tap in bathroom" {...register("title")} />
        <FieldError message={errors.title?.message} />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={3} {...register("description")} />
        <FieldError message={errors.description?.message} />
      </div>

      <div>
        <Label>Photos (optional)</Label>
        <SecondaryButton
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={files.length >= MAX_IMAGES}
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
          <ul className="mt-2 space-y-1">
            {files.map((file, i) => (
              <li key={`${file.name}-${i}`} className="flex items-center justify-between text-sm text-slate-600">
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="ml-2 text-xs font-medium text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit"}
        </Button>
        <SecondaryButton
          type="button"
          onClick={() => {
            setOpen(false);
            setFiles([]);
          }}
        >
          Cancel
        </SecondaryButton>
      </div>
    </form>
  );
}
