"use client";

import { useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui";
import type { PropertyImageItem } from "@/lib/hooks/use-property-images";

export function PhotoGallery({
  images,
  uploading,
  busyId,
  error,
  onUpload,
  onDelete,
  onSetFeatured,
}: {
  images: PropertyImageItem[];
  uploading: boolean;
  busyId: string | null;
  error: string | null;
  onUpload: (files: FileList) => void;
  onDelete: (id: string) => void;
  onSetFeatured: (id: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {images.length === 0
            ? "No photos yet."
            : "Hover a photo to delete it or mark it as the featured image."}
        </p>
        <Button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          {uploading ? "Uploading…" : "Upload photos"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) onUpload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image) => (
            <div key={image.id} className="group relative aspect-square overflow-hidden rounded-md">
              <Image src={image.url} alt="" fill sizes="25vw" className="object-cover" />
              {image.featured && (
                <span className="absolute left-1 top-1 rounded-full bg-ivy-700 px-2 py-0.5 text-xs font-medium text-white">
                  Featured
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!image.featured && (
                  <button
                    type="button"
                    onClick={() => onSetFeatured(image.id)}
                    disabled={busyId === image.id}
                    className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-slate-800"
                  >
                    Set featured
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(image.id)}
                  disabled={busyId === image.id}
                  className="ml-auto rounded-full bg-black/60 px-2 py-1 text-xs text-white"
                >
                  {busyId === image.id ? "…" : "✕"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
