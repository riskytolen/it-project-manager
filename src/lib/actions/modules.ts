"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const projectStatusEnum = z.enum([
  "planning",
  "ongoing",
  "pending",
  "completed",
  "cancelled",
]);
const priorityEnum = z.enum(["low", "medium", "high", "urgent"]);

const moduleSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().trim().min(1, "Nama modul wajib diisi").max(120),
  description: z.string().trim().optional().nullable(),
  status: projectStatusEnum,
  priority: priorityEnum,
});

function fd(formData: FormData, defaults: Partial<{ project_id: string }> = {}) {
  return {
    project_id:
      formData.get("project_id")?.toString() ?? defaults.project_id ?? "",
    name: formData.get("name")?.toString() ?? "",
    description: formData.get("description")?.toString() || null,
    status: formData.get("status")?.toString() ?? "planning",
    priority: formData.get("priority")?.toString() ?? "medium",
  };
}

async function logActivity(
  entity_type: string,
  entity_id: string | null,
  action: string,
  description: string,
) {
  const supabase = await createClient();
  await supabase.from("activity_logs").insert({
    entity_type,
    entity_id,
    action,
    description,
  });
}

export async function createModule(formData: FormData) {
  const parsed = moduleSchema.safeParse(fd(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  }

  const supabase = await createClient();

  // Append to end (max position + 1)
  const { data: maxRow } = await supabase
    .from("modules")
    .select("position")
    .eq("project_id", parsed.data.project_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (maxRow?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("modules")
    .insert({ ...parsed.data, position: nextPosition, progress: 0 })
    .select("id, name, project_id")
    .single();

  if (error) return { error: error.message };

  await logActivity(
    "module",
    data.id,
    "created",
    `Modul "${data.name}" dibuat`,
  );

  revalidatePath(`/projects/${data.project_id}`);
  return { success: true, id: data.id };
}

export async function updateModule(id: string, formData: FormData) {
  const parsed = moduleSchema.safeParse(fd(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("modules")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: error.message };

  await logActivity(
    "module",
    id,
    "updated",
    `Modul "${parsed.data.name}" diperbarui`,
  );

  revalidatePath(`/projects/${parsed.data.project_id}`);
  return { success: true };
}

export async function deleteModule(id: string, projectId: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("modules")
    .select("name")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("modules").delete().eq("id", id);
  if (error) return { error: error.message };

  await logActivity(
    "module",
    id,
    "deleted",
    `Modul "${existing?.name ?? id}" dihapus`,
  );

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
