"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "project-files";

export async function uploadFile(formData: FormData) {
  const file = formData.get("file") as File | null;
  const projectId = formData.get("project_id")?.toString() || null;
  const taskId = formData.get("task_id")?.toString() || null;

  if (!file || file.size === 0) {
    return { error: "No file selected" };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: "File exceeds 10MB limit" };
  }

  const supabase = await createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) return { error: uploadError.message };

  const { error: dbError } = await supabase.from("files").insert({
    name: file.name,
    path,
    size: file.size,
    mime_type: file.type || null,
    project_id: projectId,
    task_id: taskId,
  });

  if (dbError) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: dbError.message };
  }

  revalidatePath("/files");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteFile(id: string, path: string) {
  const supabase = await createClient();
  await supabase.storage.from(BUCKET).remove([path]);
  const { error } = await supabase.from("files").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/files");
  return { success: true };
}

export async function getFileUrl(path: string) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
