"use client";

import { useState } from "react";

export type PropertyImageItem = { id: string; url: string; featured: boolean };

export function usePropertyImages(propertyId: string, initial: PropertyImageItem[] = []) {
  const [images, setImages] = useState<PropertyImageItem[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      list.forEach((file) => formData.append("files", file));
      const res = await fetch(`/api/properties/${propertyId}/images`, {
        method: "POST",
        body: formData,
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Upload failed");
        return;
      }
      setImages((prev) => [...prev, ...(body as PropertyImageItem[])]);
    } finally {
      setUploading(false);
    }
  }

  async function deleteImage(imageId: string) {
    setError(null);
    setBusyId(imageId);
    try {
      const res = await fetch(`/api/properties/${propertyId}/images/${imageId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Delete failed");
        return;
      }
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } finally {
      setBusyId(null);
    }
  }

  async function setFeatured(imageId: string) {
    setError(null);
    setBusyId(imageId);
    try {
      const res = await fetch(`/api/properties/${propertyId}/images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: true }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Something went wrong");
        return;
      }
      setImages((prev) => prev.map((img) => ({ ...img, featured: img.id === imageId })));
    } finally {
      setBusyId(null);
    }
  }

  return { images, uploading, busyId, error, uploadFiles, deleteImage, setFeatured };
}
