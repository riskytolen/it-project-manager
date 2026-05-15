import Link from "next/link";
import { KanbanSquare, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KanbanBoard } from "@/components/board/kanban-board";
import { EmptyState } from "@/components/ui/empty-state";
import type { Project, Task } from "@/types";

export const dynamic = "force-dynamic";

interface SearchParams {
  project?: string;
}

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const [{ data: projects }, taskQuery] = await Promise.all([
    supabase.from("projects").select("id, name").order("name"),
    (async () => {
      let q = supabase
        .from("tasks")
        .select("*")
        .order("position", { ascending: true });
      if (params.project && params.project !== "all") {
        q = q.eq("project_id", params.project);
      }
      return q;
    })(),
  ]);

  const allProjects = (projects ?? []) as Pick<Project, "id" | "name">[];
  const allTasks = (taskQuery.data ?? []) as Task[];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Papan Tugas</h1>
          <p className="text-sm text-muted-foreground">
            Seret dan letakkan tugas antar kolom untuk memperbarui status
          </p>
        </div>
        <form className="flex items-center gap-2">
          <select
            name="project"
            defaultValue={params.project ?? "all"}
            className="h-9 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">Semua Proyek</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-md border border-border bg-card px-3 text-xs font-medium hover:bg-accent"
          >
            Filter
          </button>
        </form>
      </div>

      {allProjects.length === 0 ? (
        <EmptyState
          icon={KanbanSquare}
          title="Belum ada proyek"
          description="Buat proyek terlebih dahulu untuk mulai mengelola tugas di papan."
          action={
            <Link
              href="/projects/new"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Buat Proyek
            </Link>
          }
        />
      ) : (
        <KanbanBoard
          initialTasks={allTasks}
          projects={allProjects}
          selectedProjectId={params.project}
        />
      )}
    </div>
  );
}
