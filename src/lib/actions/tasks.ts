"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const taskStatusEnum = z.enum([
  "todo",
  "in_progress",
  "testing",
  "revision",
  "done",
]);
const priorityEnum = z.enum(["low", "medium", "high", "urgent"]);

const taskSchema = z.object({
  project_id: z.string().uuid(),
  module_id: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().optional().nullable(),
  status: taskStatusEnum,
  priority: priorityEnum,
  deadline: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  notes: z.string().trim().optional().nullable(),
});

function fd(formData: FormData, defaults: Partial<{ project_id: string }> = {}) {
  const moduleId = formData.get("module_id")?.toString();
  return {
    project_id:
      formData.get("project_id")?.toString() ?? defaults.project_id ?? "",
    module_id: moduleId && moduleId !== "" ? moduleId : null,
    title: formData.get("title")?.toString() ?? "",
    description: formData.get("description")?.toString() || null,
    status: formData.get("status")?.toString() ?? "todo",
    priority: formData.get("priority")?.toString() ?? "medium",
    deadline: formData.get("deadline")?.toString() || null,
    notes: formData.get("notes")?.toString() || null,
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

export async function createTask(formData: FormData) {
  const parsed = taskSchema.safeParse(fd(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tugas tidak valid" };
  }

  const supabase = await createClient();

  // determine position (last in column)
  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("project_id", parsed.data.project_id)
    .eq("status", parsed.data.status);

  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...parsed.data, position: count ?? 0, progress: 0 })
    .select("id, title, project_id")
    .single();

  if (error) return { error: error.message };

  await logActivity(
    "task",
    data.id,
    "created",
    `Tugas "${data.title}" dibuat`,
  );

  revalidatePath(`/projects/${data.project_id}`);
  revalidatePath("/board");
  revalidatePath("/dashboard");
  return { success: true, id: data.id };
}

export async function updateTask(id: string, formData: FormData) {
  const parsed = taskSchema.safeParse(fd(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tugas tidak valid" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  await logActivity(
    "task",
    id,
    "updated",
    `Tugas "${parsed.data.title}" diperbarui`,
  );

  revalidatePath(`/projects/${parsed.data.project_id}`);
  revalidatePath("/board");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTask(id: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { error: error.message };

  await logActivity("task", id, "deleted", "Tugas dihapus");

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/board");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTaskStatus(id: string, status: string) {
  const supabase = await createClient();
  const safeStatus = taskStatusEnum.parse(status);
  const updates: Record<string, unknown> = { status: safeStatus };
  if (safeStatus === "done") updates.progress = 100;

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select("project_id, title")
    .single();

  if (error) return { error: error.message };

  const statusLabelMap: Record<string, string> = {
    todo: "Belum Dikerjakan",
    in_progress: "Dikerjakan",
    testing: "Pengujian",
    revision: "Revisi",
    done: "Selesai",
  };

  await logActivity(
    "task",
    id,
    "status_changed",
    `Tugas "${data.title}" dipindah ke ${statusLabelMap[safeStatus] ?? safeStatus}`,
  );

  revalidatePath(`/projects/${data.project_id}`);
  revalidatePath("/board");
  revalidatePath("/dashboard");
  return { success: true };
}

// ============= CHECKLIST =============
export async function addChecklistItem(taskId: string, content: string) {
  if (!content.trim()) return { error: "Konten wajib diisi" };
  const supabase = await createClient();

  const { count } = await supabase
    .from("task_checklists")
    .select("id", { count: "exact", head: true })
    .eq("task_id", taskId);

  const { error } = await supabase.from("task_checklists").insert({
    task_id: taskId,
    content: content.trim(),
    position: count ?? 0,
  });
  if (error) return { error: error.message };
  revalidatePath("/projects", "layout");
  return { success: true };
}

export async function toggleChecklistItem(id: string, isDone: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("task_checklists")
    .update({ is_done: isDone })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects", "layout");
  return { success: true };
}

export async function deleteChecklistItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("task_checklists").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects", "layout");
  return { success: true };
}
