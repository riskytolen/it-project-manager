import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FolderKanban,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusPieChart, TasksBarChart } from "@/components/dashboard/charts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import {
  formatDate,
  formatDateRelative,
  isOverdue,
  projectStatusLabel,
  taskStatusLabel,
} from "@/lib/utils";
import type { Project, Task, ActivityLog } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: projects },
    { data: tasks },
    { data: activities },
  ] = await Promise.all([
    supabase.from("projects").select("*").order("updated_at", { ascending: false }),
    supabase.from("tasks").select("*").order("deadline", { ascending: true, nullsFirst: false }),
    supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const allProjects = (projects ?? []) as Project[];
  const allTasks = (tasks ?? []) as Task[];
  const allActivities = (activities ?? []) as ActivityLog[];

  const activeProjects = allProjects.filter(
    (p) => p.status === "ongoing" || p.status === "planning" || p.status === "pending",
  );
  const completedProjects = allProjects.filter((p) => p.status === "completed");
  const overdueTasks = allTasks.filter((t) => isOverdue(t.deadline, t.status));
  const upcoming = allTasks
    .filter((t) => t.deadline && t.status !== "done" && !isOverdue(t.deadline, t.status))
    .slice(0, 5);

  const totalProgress =
    allProjects.length === 0
      ? 0
      : Math.round(
          allProjects.reduce((sum, p) => sum + p.progress, 0) /
            allProjects.length,
        );

  const projectStatusData = (
    ["planning", "ongoing", "pending", "completed", "cancelled"] as const
  ).map((s) => ({
    name: projectStatusLabel[s],
    value: allProjects.filter((p) => p.status === s).length,
  }));

  const taskStatusData = (
    ["todo", "in_progress", "testing", "revision", "done"] as const
  ).map((s) => ({
    name: taskStatusLabel[s],
    count: allTasks.filter((t) => t.status === s).length,
  }));

  const isEmpty = allProjects.length === 0 && allTasks.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-orange-700/15 via-amber-600/5 to-transparent p-6 sm:p-8">
        <div className="grid-bg absolute inset-0 opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Workspace
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            Here&apos;s an overview of your IT projects, tasks, and upcoming deadlines.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/projects/new"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Link>
            <Link
              href="/board"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium hover:bg-accent"
            >
              Open Task Board
            </Link>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Start by creating your first IT project to track tasks, deadlines, and progress."
          action={
            <Link
              href="/projects/new"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create First Project
            </Link>
          }
        />
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              label="Active Projects"
              value={activeProjects.length}
              icon={FolderKanban}
              hint={`${allProjects.length} total`}
              accent="primary"
            />
            <StatCard
              label="Completed"
              value={completedProjects.length}
              icon={CheckCircle2}
              hint="Finished projects"
              accent="success"
            />
            <StatCard
              label="Overdue"
              value={overdueTasks.length}
              icon={AlertTriangle}
              hint="Tasks past deadline"
              accent="danger"
            />
            <StatCard
              label="Upcoming"
              value={upcoming.length}
              icon={Clock}
              hint="Next deadlines"
              accent="warning"
            />
            <StatCard
              label="Avg Progress"
              value={`${totalProgress}%`}
              icon={TrendingUp}
              hint="Across all projects"
              accent="info"
            />
          </div>

          {/* Charts row */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Status</CardTitle>
                <CardDescription>Distribution by current state</CardDescription>
              </CardHeader>
              <CardContent>
                <StatusPieChart data={projectStatusData} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Tasks by Status</CardTitle>
                <CardDescription>How your work is distributed</CardDescription>
              </CardHeader>
              <CardContent>
                <TasksBarChart data={taskStatusData} />
              </CardContent>
            </Card>
          </div>

          {/* Active projects + activity */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>Active Projects</CardTitle>
                  <CardDescription>In planning, ongoing, or pending</CardDescription>
                </div>
                <Link
                  href="/projects"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View all →
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeProjects.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No active projects.
                  </p>
                ) : (
                  activeProjects.slice(0, 5).map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="block rounded-lg border border-border p-3.5 transition-colors hover:bg-accent/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate text-sm font-semibold">
                              {p.name}
                            </h4>
                            <PriorityBadge priority={p.priority} />
                          </div>
                          {p.description && (
                            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                              {p.description}
                            </p>
                          )}
                        </div>
                        <ProjectStatusBadge status={p.status} />
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <Progress value={p.progress} className="flex-1" size="sm" />
                        <span className="text-xs font-medium tabular-nums text-muted-foreground">
                          {p.progress}%
                        </span>
                      </div>
                      {p.deadline && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Target className="h-3 w-3" />
                          Due {formatDate(p.deadline)}
                        </div>
                      )}
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Last actions in your workspace</CardDescription>
              </CardHeader>
              <CardContent>
                {allActivities.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No activity yet.
                  </p>
                ) : (
                  <ol className="relative space-y-4">
                    <span className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
                    {allActivities.map((a) => (
                      <li key={a.id} className="relative pl-6">
                        <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                        <p className="text-xs font-medium text-foreground">
                          {a.description}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDateRelative(a.created_at)}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming deadlines */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Tasks with the nearest due dates</CardDescription>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  All caught up. No upcoming task deadlines.
                </p>
              ) : (
                <div className="space-y-2">
                  {upcoming.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateRelative(t.deadline)} •{" "}
                          {formatDate(t.deadline)}
                        </p>
                      </div>
                      <PriorityBadge priority={t.priority} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
