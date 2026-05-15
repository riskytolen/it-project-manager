"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const projectCategoryEnum = z.enum([
  "website",
  "application",
  "maintenance",
  "support",
  "infrastructure",
  "database",
  "other",
]);

const projectStatusEnum = z.enum([
  "planning",
  "ongoing",
  "pending",
  "completed",
  "cancelled",
]);

const priorityEnum = z.enum(["low", "medium", "high", "urgent"]);

const projectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().optional().nullable(),
  category: projectCategoryEnum,
  status: projectStatusEnum,
  priority: priorityEnum,
  deadline: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  notes: z.string().trim().optional().nullable(),
});

function fd(formData: FormData) {
  return {
    name: formData.get("name")?.toString() ?? "",
    description: formData.get("description")?.toString() || null,
    category: formData.get("category")?.toString() ?? "other",
    status: formData.get("status")?.toString() ?? "planning",
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

export async function createProject(formData: FormData) {
  const parsed = projectSchema.safeParse(fd(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...parsed.data, progress: 0 })
    .select("id, name")
    .single();

  if (error) return { error: error.message };

  await logActivity(
    "project",
    data.id,
    "created",
    `Project "${data.name}" was created`,
  );

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect(`/projects/${data.id}`);
}

export async function updateProject(id: string, formData: FormData) {
  const parsed = projectSchema.safeParse(fd(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: error.message };

  await logActivity(
    "project",
    id,
    "updated",
    `Project "${parsed.data.name}" was updated`,
  );

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
  redirect(`/projects/${id}`);
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };

  await logActivity(
    "project",
    id,
    "deleted",
    `Project "${project?.name ?? id}" was deleted`,
  );

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect("/projects");
}

export async function updateProjectProgress(id: string, progress: number) {
  const supabase = await createClient();
  const safe = Math.max(0, Math.min(100, Math.round(progress)));
  const { error } = await supabase
    .from("projects")
    .update({ progress: safe })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
  return { success: true };
}
