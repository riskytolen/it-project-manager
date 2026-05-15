import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  FileText,
  ListChecks,
  Pencil,
  StickyNote,
  Tag,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  PriorityBadge,
  ProjectStatusBadge,
} from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { TaskList } from "@/components/tasks/task-list";
import { AddTaskButton } from "@/components/tasks/add-task-button";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { ProjectAttachments } from "@/components/projects/project-attachments";
import {
  formatDate,
  formatDateRelative,
  isOverdue,
  projectCategoryLabel,
  taskStatusLabel,
} from "@/lib/utils";
import type {
  ActivityLog,
  FileRecord,
  Project,
  Task,
  TaskChecklist,
  TaskStatus,
} from "@/types";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: project },
    { data: tasks },
    { data: checklists },
    { data: activities },
    { data: files },
  ] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase
      .from("tasks")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("task_checklists")
      .select("*")
      .order("position", { ascending: true }),
    supabase
      .from("activity_logs")
      .select("*")
      .eq("entity_type", "task")
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("files")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!project) notFound();
  const proj = project as Project;
  const allTasks = (tasks ?? []) as Task[];
  const allChecklists = (checklists ?? []) as TaskChecklist[];
  const tasksWithChecklists = allTasks.map((t) => ({
    ...t,
    task_checklists: allChecklists.filter((c) => c.task_id === t.id),
  }));

  const taskStats: Record<TaskStatus, number> = {
    todo: 0,
    in_progress: 0,
    testing: 0,
    revision: 0,
    done: 0,
  };
  for (const t of allTasks) taskStats[t.status]++;

  const overdue = isOverdue(proj.deadline, proj.status);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${proj.id}/edit`}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3.5 text-sm font-medium hover:bg-accent"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
          <DeleteProjectButton id={proj.id} name={proj.name} />
        </div>
      </div>

      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <ProjectStatusBadge status={proj.status} />
            <PriorityBadge priority={proj.priority} />
            <Badge variant="outline">
              <Tag className="h-3 w-3" />
              {projectCategoryLabel[proj.category]}
            </Badge>
            {overdue && (
              <Badge className="border-red-200 bg-red-100 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                Overdue
              </Badge>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{proj.name}</h1>
          {proj.description && (
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
              {proj.description}
            </p>
          )}

          <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Deadline
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {proj.deadline ? formatDate(proj.deadline) : "—"}
              </p>
              {proj.deadline && (
                <p className="text-xs text-muted-foreground">
                  {formatDateRelative(proj.deadline)}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Created
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {formatDate(proj.created_at)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Last Updated
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {formatDateRelative(proj.updated_at)}
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Project Progress
              </p>
              <span className="text-sm font-semibold tabular-nums">
                {proj.progress}%
              </span>
            </div>
            <Progress value={proj.progress} size="lg" />
          </div>
        </CardContent>
      </Card>

      {/* Task stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(
          ["todo", "in_progress", "testing", "revision", "done"] as TaskStatus[]
        ).map((s) => (
          <div
            key={s}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {taskStatusLabel[s]}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {taskStats[s]}
            </p>
          </div>
        ))}
      </div>

      {/* Tasks + Sidebar grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                Tasks
              </CardTitle>
              <CardDescription>
                {allTasks.length} {allTasks.length === 1 ? "task" : "tasks"}{" "}
                in this project
              </CardDescription>
            </div>
            <AddTaskButton projectId={proj.id} />
          </CardHeader>
          <CardContent>
            <TaskList projectId={proj.id} tasks={tasksWithChecklists} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {proj.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <StickyNote className="h-4 w-4 text-primary" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {proj.notes}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                Attachments
              </CardTitle>
              <CardDescription>
                Files linked to this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectAttachments
                projectId={proj.id}
                files={(files ?? []) as FileRecord[]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-primary" />
                Timeline
              </CardTitle>
              <CardDescription>Recent task activity</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const projectTaskIds = new Set(allTasks.map((t) => t.id));
                const filtered = (activities ?? []).filter(
                  (a: ActivityLog) =>
                    a.entity_id && projectTaskIds.has(a.entity_id),
                ) as ActivityLog[];
                if (filtered.length === 0) {
                  return (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      No activity yet.
                    </p>
                  );
                }
                return (
                  <ol className="relative space-y-3">
                    <span className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
                    {filtered.slice(0, 8).map((a) => (
                      <li key={a.id} className="relative pl-5">
                        <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                        <p className="text-xs font-medium">{a.description}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDateRelative(a.created_at)}
                        </p>
                      </li>
                    ))}
                  </ol>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
