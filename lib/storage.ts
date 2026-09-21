import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

const PROPERTY_BUCKET = "property-images";
const COMPLAINT_BUCKET = "complaint-images";
const LEASE_DOCUMENT_BUCKET = "lease-documents";
const TENANT_DOCUMENT_BUCKET = "tenant-documents";

// Created lazily (not at module load) so importing this file — which Next.js
// does when statically analyzing API routes at build time — doesn't crash
// the build in environments where SUPABASE_URL/SUPABASE_SECRET_KEY aren't
// set yet. Only actually uploading/deleting a file needs the real values.
let cachedClient: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient {
  if (!cachedClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be set to use file storage");
    }
    cachedClient = createClient(url, key);
  }
  return cachedClient;
}

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const DOCUMENT_TYPES = new Set([...IMAGE_TYPES, "application/pdf"]);
const MAX_BYTES = 5 * 1024 * 1024;

export function isAllowedImage(file: File): string | null {
  if (!IMAGE_TYPES.has(file.type)) {
    return "Only JPEG, PNG, WEBP, or GIF images are allowed";
  }
  if (file.size > MAX_BYTES) {
    return "Each image must be 5MB or smaller";
  }
  return null;
}

export function isAllowedDocument(file: File): string | null {
  if (!DOCUMENT_TYPES.has(file.type)) {
    return "Only PDF, JPEG, PNG, WEBP, or GIF files are allowed";
  }
  if (file.size > MAX_BYTES) {
    return "Each file must be 5MB or smaller";
  }
  return null;
}

async function uploadFile(bucket: string, folder: string, file: File): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin();
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabaseAdmin.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function deleteFile(bucket: string, publicUrl: string): Promise<void> {
  const marker = `/object/public/${bucket}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return;
  const path = publicUrl.slice(index + marker.length);
  await getSupabaseAdmin().storage.from(bucket).remove([path]);
}

export function uploadPropertyImage(propertyId: string, file: File): Promise<string> {
  return uploadFile(PROPERTY_BUCKET, propertyId, file);
}

export function deletePropertyImageFile(publicUrl: string): Promise<void> {
  return deleteFile(PROPERTY_BUCKET, publicUrl);
}

export function uploadComplaintImage(complaintId: string, file: File): Promise<string> {
  return uploadFile(COMPLAINT_BUCKET, complaintId, file);
}

export function deleteComplaintImageFile(publicUrl: string): Promise<void> {
  return deleteFile(COMPLAINT_BUCKET, publicUrl);
}

export function uploadLeaseDocument(leaseId: string, file: File): Promise<string> {
  return uploadFile(LEASE_DOCUMENT_BUCKET, leaseId, file);
}

export function deleteLeaseDocumentFile(publicUrl: string): Promise<void> {
  return deleteFile(LEASE_DOCUMENT_BUCKET, publicUrl);
}

export function uploadTenantDocument(tenantId: string, file: File): Promise<string> {
  return uploadFile(TENANT_DOCUMENT_BUCKET, tenantId, file);
}

export function deleteTenantDocumentFile(publicUrl: string): Promise<void> {
  return deleteFile(TENANT_DOCUMENT_BUCKET, publicUrl);
}
