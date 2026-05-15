"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const noteCategoryEnum = z.enum([
  "bug",
  "feature_idea",
  "documentation",
  "maintenance",
  "reminder",
  "general",
]);

const noteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().optional().nullable(),
  category: noteCategoryEnum,
  is_pinned: z.boolean().optional().default(false),
  project_id: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
});

function fd(formData: FormData) {
  const projectId = formData.get("project_id")?.toString();
  return {
    title: formData.get("title")?.toString() ?? "",
    content: formData.get("content")?.toString() || null,
    category: formData.get("category")?.toString() ?? "general",
    is_pinned: formData.get("is_pinned") === "on",
    project_id: projectId && projectId !== "" ? projectId : null,
  };
}

export async function createNote(formData: FormData) {
  const parsed = noteSchema.safeParse(fd(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid note" };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("notes").insert(parsed.data);
  if (error) return { error: error.message };
  revalidatePath("/notes");
  return { success: true };
}

export async function updateNote(id: string, formData: FormData) {
  const parsed = noteSchema.safeParse(fd(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid note" };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("notes").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/notes");
  return { success: true };
}

export async function deleteNote(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/notes");
  return { success: true };
}

export async function togglePinNote(id: string, isPinned: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notes")
    .update({ is_pinned: isPinned })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/notes");
  return { success: true };
}
