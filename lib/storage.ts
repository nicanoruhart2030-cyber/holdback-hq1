import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export const DOCUMENTS_BUCKET = "documents";
export const SIGNED_URL_TTL_SECONDS = 300;

export const ACCEPTED_MIME = ["application/pdf", "image/png", "image/jpeg", "image/webp"] as const;
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export function safeFileName(name: string): string {
  const cleaned = name.normalize("NFKD").replace(/[^\w.-]+/g, "_").replace(/_+/g, "_");
  return cleaned.slice(-120) || "document";
}

export async function uploadDocument(
  supabase: SupabaseClient,
  path: string,
  file: ArrayBuffer,
  contentType: string,
): Promise<void> {
  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, { contentType, upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
}

export async function signedUrl(supabase: SupabaseClient, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  return error ? null : data.signedUrl;
}

export async function removeDocuments(supabase: SupabaseClient, paths: string[]): Promise<void> {
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).remove(paths.slice(i, i + 100));
    if (error) throw new Error(`Storage delete failed: ${error.message}`);
  }
}
