import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FolderKanban,
  FolderOpen,
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
import { WhatsAppShareButton } from "@/components/share/whatsapp-share-button";
import {
  formatDate,
  formatDateRelative,
  isOverdue,
  projectStatusLabel,
  taskStatusLabel,
} from "@/lib/utils";
import { buildWorkspaceWhatsAppReport } from "@/lib/utils/whatsapp-report";
import { buildBoardUrl, getAppUrl } from "@/lib/utils/app-url";
import type { Project, Task, ActivityLog, Module } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: projects },
    { data: tasks },
    { data: activities },
    { data: modules },
  ] = await Promise.all([
    supabase.from("projects").select("*").order("updated_at", { ascending: false }),
    supabase.from("tasks").select("*").order("deadline", { ascending: true, nullsFirst: false }),
    supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("modules")
      .select("*")
      .order("position", { ascending: true }),
  ]);

  const allProjects = (projects ?? []) as Project[];
  const allTasks = (tasks ?? []) as Task[];
  const allActivities = (activities ?? []) as ActivityLog[];
  const allModules = (modules ?? []) as Module[];

  const activeProjects = allProjects.filter(
    (p) => p.status === "ongoing" || p.status === "planning" || p.status === "pending",
  );
  const completedProjects = allProjects.filter((p) => p.status === "completed");
  const overdueTasks = allTasks.filter((t) => isOverdue(t.deadline, t.status));
  const upcoming = allTasks
    .filter((t) => t.deadline && t.status !== "done" && !isOverdue(t.deadline, t.status))
    .slice(0, 5);

  // Module stats
  const completedModules = allModules.filter((m) => m.status === "completed").length;
  const modulesByProject = new Map<string, Module[]>();
  for (const m of allModules) {
    if (!modulesByProject.has(m.project_id)) {
      modulesByProject.set(m.project_id, []);
    }
    modulesByProject.get(m.project_id)!.push(m);
  }

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

  const baseUrl = await getAppUrl();
  const waReport = buildWorkspaceWhatsAppReport({
    projects: allProjects,
    tasks: allTasks,
    boardUrl: buildBoardUrl(baseUrl),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-orange-700/15 via-amber-600/5 to-transparent p-6 sm:p-8">
        <div className="grid-bg absolute inset-0 opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Ruang Kerja
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Selamat datang kembali
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            Berikut ringkasan proyek IT, tugas, dan tenggat waktu yang akan datang.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/projects/new"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Proyek Baru
            </Link>
            <Link
              href="/board"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium hover:bg-accent"
            >
              Buka Papan Tugas
            </Link>
            {!isEmpty && (
              <WhatsAppShareButton
                text={waReport}
                label="Bagikan ke WhatsApp"
              />
            )}
          </div>
        </div>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={FolderKanban}
          title="Belum ada proyek"
          description="Mulai dengan membuat proyek IT pertama untuk melacak tugas, tenggat, dan progres."
          action={
            <Link
              href="/projects/new"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Buat Proyek Pertama
            </Link>
          }
        />
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard
              label="Proyek Aktif"
              value={activeProjects.length}
              icon={FolderKanban}
              hint={`${allProjects.length} total`}
              accent="primary"
            />
            <StatCard
              label="Modul"
              value={allModules.length}
              icon={FolderOpen}
              hint={`${completedModules} selesai`}
              accent="info"
            />
            <StatCard
              label="Selesai"
              value={completedProjects.length}
              icon={CheckCircle2}
              hint="Proyek tuntas"
              accent="success"
            />
            <StatCard
              label="Terlambat"
              value={overdueTasks.length}
              icon={AlertTriangle}
              hint="Tugas lewat tenggat"
              accent="danger"
            />
            <StatCard
              label="Akan Datang"
              value={upcoming.length}
              icon={Clock}
              hint="Tenggat berikutnya"
              accent="warning"
            />
            <StatCard
              label="Rata-rata Progres"
              value={`${totalProgress}%`}
              icon={TrendingUp}
              hint="Seluruh proyek"
              accent="info"
            />
          </div>

          {/* Charts row */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status Proyek</CardTitle>
                <CardDescription>Distribusi berdasarkan status saat ini</CardDescription>
              </CardHeader>
              <CardContent>
                <StatusPieChart data={projectStatusData} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Tugas per Status</CardTitle>
                <CardDescription>Sebaran pekerjaan kamu</CardDescription>
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
                  <CardTitle>Proyek Aktif</CardTitle>
                  <CardDescription>Dalam tahap perencanaan, berjalan, atau tertunda</CardDescription>
                </div>
                <Link
                  href="/projects"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Lihat semua →
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeProjects.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Tidak ada proyek aktif.
                  </p>
                ) : (
                  activeProjects.slice(0, 5).map((p) => {
                    const projectModules = modulesByProject.get(p.id) ?? [];
                    return (
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
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {projectModules.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <FolderOpen className="h-3 w-3" />
                            {projectModules.length} modul
                          </span>
                        )}
                        {p.deadline && (
                          <span className="inline-flex items-center gap-1.5">
                            <Target className="h-3 w-3" />
                            Tenggat {formatDate(p.deadline)}
                          </span>
                        )}
                      </div>
                    </Link>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aktivitas Terbaru</CardTitle>
                <CardDescription>Aksi terakhir di ruang kerja kamu</CardDescription>
              </CardHeader>
              <CardContent>
                {allActivities.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada aktivitas.
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
              <CardTitle>Tenggat Akan Datang</CardTitle>
              <CardDescription>Tugas dengan tenggat terdekat</CardDescription>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Semuanya beres. Tidak ada tenggat tugas yang akan datang.
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
