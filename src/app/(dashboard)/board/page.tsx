import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  KanbanSquare,
  ListTodo,
  Loader2,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KanbanBoard } from "@/components/board/kanban-board";
import { EmptyState } from "@/components/ui/empty-state";
import { isOverdue } from "@/lib/utils";
import type { Project, Task, TaskChecklist } from "@/types";

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

  const [{ data: projects }, taskQuery, { data: checklists }] =
    await Promise.all([
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
      supabase
        .from("task_checklists")
        .select("*")
        .order("position", { ascending: true }),
    ]);

  const allProjects = (projects ?? []) as Pick<Project, "id" | "name">[];
  const allTasks = (taskQuery.data ?? []) as Task[];
  const allChecklists = (checklists ?? []) as TaskChecklist[];

  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = allTasks.filter(
    (t) => t.status === "in_progress",
  ).length;
  const overdueTasks = allTasks.filter((t) =>
    isOverdue(t.deadline, t.status),
  ).length;

  const completionPercent =
    totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  const selectedProjectName =
    params.project && params.project !== "all"
      ? allProjects.find((p) => p.id === params.project)?.name
      : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-orange-700/15 via-amber-600/5 to-transparent p-6 sm:p-8">
        <div className="grid-bg absolute inset-0 opacity-30" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <KanbanSquare className="h-3.5 w-3.5" />
              Papan Tugas
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              {selectedProjectName ?? "Semua Tugas"}
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Seret kartu antar kolom untuk memperbarui status. Tetap fokus,
              kelola alur kerja, dan rayakan kemajuan.
            </p>
          </div>

          <form className="flex items-center gap-2 self-stretch sm:self-end">
            <div className="relative flex items-center">
              <Filter className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
              <select
                name="project"
                defaultValue={params.project ?? "all"}
                className="h-9 w-full appearance-none rounded-md border border-input bg-card pl-9 pr-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-56"
              >
                <option value="all">Semua Proyek</option>
                {allProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98]"
            >
              Terapkan
            </button>
          </form>
        </div>
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
        <>
          {/* Stats overview */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <BoardStat
              label="Total Tugas"
              value={totalTasks}
              icon={ListTodo}
              tone="primary"
            />
            <BoardStat
              label="Sedang Dikerjakan"
              value={inProgressTasks}
              icon={Loader2}
              tone="info"
            />
            <BoardStat
              label="Selesai"
              value={`${doneTasks} • ${completionPercent}%`}
              icon={CheckCircle2}
              tone="success"
            />
            <BoardStat
              label="Terlambat"
              value={overdueTasks}
              icon={AlertTriangle}
              tone="danger"
            />
          </div>

          <KanbanBoard
            initialTasks={allTasks}
            initialChecklists={allChecklists}
            projects={allProjects}
            selectedProjectId={params.project}
          />
        </>
      )}
    </div>
  );
}

function BoardStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: typeof ListTodo;
  tone: "primary" | "info" | "success" | "danger";
}) {
  const tones: Record<typeof tone, string> = {
    primary: "bg-orange-700/10 text-orange-700 dark:text-orange-400",
    info: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums leading-none">
            {value}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${tones[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
