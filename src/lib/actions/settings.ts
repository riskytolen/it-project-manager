"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();
  const display_name = formData.get("display_name")?.toString() || "IT Manager";
  const accent_color = formData.get("accent_color")?.toString() || "blue";
  const weekly_goal = parseInt(
    formData.get("weekly_goal")?.toString() || "10",
    10,
  );

  const { error } = await supabase
    .from("settings")
    .update({
      display_name,
      accent_color,
      weekly_goal: Number.isFinite(weekly_goal) ? weekly_goal : 10,
    })
    .eq("id", 1);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}
