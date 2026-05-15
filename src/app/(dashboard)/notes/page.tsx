import { createClient } from "@/lib/supabase/server";
import { NotesView } from "@/components/notes/notes-view";
import type { Note, Project } from "@/types";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  category?: string;
}

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let q = supabase
    .from("notes")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (params.category && params.category !== "all") {
    q = q.eq("category", params.category);
  }
  if (params.q) {
    q = q.or(`title.ilike.%${params.q}%,content.ilike.%${params.q}%`);
  }

  const [{ data: notes }, { data: projects }] = await Promise.all([
    q,
    supabase.from("projects").select("id, name").order("name"),
  ]);

  return (
    <NotesView
      notes={(notes ?? []) as Note[]}
      projects={(projects ?? []) as Pick<Project, "id" | "name">[]}
      defaultQuery={params.q}
      defaultCategory={params.category ?? "all"}
    />
  );
}
