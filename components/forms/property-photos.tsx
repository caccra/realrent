"use client";

import { Card } from "@/components/ui";
import { PhotoGallery } from "@/components/forms/photo-gallery";
import { usePropertyImages, type PropertyImageItem } from "@/lib/hooks/use-property-images";

export function PropertyPhotos({
  propertyId,
  images,
}: {
  propertyId: string;
  images: PropertyImageItem[];
}) {
  const { images: current, uploading, busyId, error, uploadFiles, deleteImage, setFeatured } =
    usePropertyImages(propertyId, images);

  return (
    <Card className="mb-6">
      <h2 className="mb-3 text-base font-medium text-slate-900">Photos</h2>
      <PhotoGallery
        images={current}
        uploading={uploading}
        busyId={busyId}
        error={error}
        onUpload={uploadFiles}
        onDelete={deleteImage}
        onSetFeatured={setFeatured}
      />
    </Card>
  );
}
