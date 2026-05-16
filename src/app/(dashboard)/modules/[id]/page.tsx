import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FolderOpen,
  KanbanSquare,
  ListTodo,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KanbanBoard } from "@/components/board/kanban-board";
import { Progress } from "@/components/ui/progress";
import {
  PriorityBadge,
  ProjectStatusBadge,
} from "@/components/ui/status-badge";
import { WhatsAppShareButton } from "@/components/share/whatsapp-share-button";
import {
  formatDate,
  formatDateRelative,
  isOverdue,
  projectStatusLabel,
} from "@/lib/utils";
import { buildBoardUrl, getAppUrl } from "@/lib/utils/app-url";
import type { Module, Project, Task, TaskChecklist } from "@/types";

export const dynamic = "force-dynamic";

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: moduleRow } = await supabase
    .from("modules")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!moduleRow) notFound();
  const mod = moduleRow as Module;

  const [
    { data: project },
    { data: tasks },
    { data: checklists },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, status, priority")
      .eq("id", mod.project_id)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("*")
      .eq("module_id", id)
      .order("position", { ascending: true }),
    supabase
      .from("task_checklists")
      .select("*")
      .order("position", { ascending: true }),
  ]);

  const proj = project as
    | (Pick<Project, "id" | "name" | "status" | "priority">)
    | null;
  const moduleTasks = (tasks ?? []) as Task[];
  const allChecklists = (checklists ?? []) as TaskChecklist[];

  const totalTasks = moduleTasks.length;
  const doneTasks = moduleTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = moduleTasks.filter(
    (t) => t.status === "in_progress",
  ).length;
  const overdueCount = moduleTasks.filter((t) =>
    isOverdue(t.deadline, t.status),
  ).length;

  // Build WhatsApp report inline (concise: nama modul + status + link)
  const baseUrl = await getAppUrl();
  const moduleUrl = `${baseUrl}/modules/${mod.id}`;
  const boardUrl = buildBoardUrl(baseUrl, mod.project_id);
  const waText = [
    `📋 *Update Modul*`,
    `━━━━━━━━━━━━━━━━━━`,
    "",
    `Halo, berikut info singkat untuk modul:`,
    `*${mod.name}*${proj ? ` (${proj.name})` : ""}`,
    `Status saat ini: ${projectStatusLabel[mod.status]}`,
    `Progres: ${mod.progress}% (${doneTasks}/${totalTasks} tugas selesai)`,
    "",
    `Untuk melihat detail tugas modul ini:`,
    `👉 ${moduleUrl}`,
    "",
    `Atau lihat papan tugas keseluruhan proyek:`,
    `👉 ${boardUrl}`,
    "",
    `━━━━━━━━━━━━━━━━━━`,
    `_Diperbarui ${new Date().toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}_`,
  ].join("\n");

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Back link */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={proj ? `/projects/${proj.id}` : "/board"}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {proj ? `Kembali ke ${proj.name}` : "Kembali ke Papan Tugas"}
        </Link>
        <div className="flex items-center gap-2">
          <WhatsAppShareButton
            text={waText}
            label="Bagikan Laporan"
            variant="outline"
          />
          <Link
            href={`/board?project=${mod.project_id}&module=${mod.id}`}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3.5 text-sm font-medium hover:bg-accent"
          >
            <KanbanSquare className="h-4 w-4" />
            Lihat di Papan Tugas
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-orange-700/10 via-amber-600/5 to-transparent p-5 sm:p-6">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <FolderOpen className="h-3.5 w-3.5" />
          Modul
          {proj && (
            <>
              <span className="text-muted-foreground/50">/</span>
              <Link
                href={`/projects/${proj.id}`}
                className="text-muted-foreground hover:text-foreground hover:underline"
              >
                {proj.name}
              </Link>
            </>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {mod.name}
        </h1>
        {mod.description && (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            {mod.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ProjectStatusBadge status={mod.status} />
          <PriorityBadge priority={mod.priority} />
          <span className="text-xs text-muted-foreground">
            Diperbarui {formatDateRelative(mod.updated_at)}
          </span>
        </div>

        <div className="mt-4 max-w-md">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">
              Progres Modul
            </span>
            <span className="font-semibold tabular-nums">{mod.progress}%</span>
          </div>
          <Progress value={mod.progress} size="lg" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ModuleStat
          label="Total Tugas"
          value={totalTasks}
          icon={ListTodo}
          tone="primary"
        />
        <ModuleStat
          label="Dikerjakan"
          value={inProgressTasks}
          icon={Loader2}
          tone="info"
        />
        <ModuleStat
          label="Selesai"
          value={doneTasks}
          icon={CheckCircle2}
          tone="success"
        />
        <ModuleStat
          label="Terlambat"
          value={overdueCount}
          icon={AlertTriangle}
          tone="danger"
        />
      </div>

      {/* Kanban scoped to this module */}
      <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-2">
          <KanbanSquare className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">
            Papan Tugas — {mod.name}
          </h2>
        </div>
        <KanbanBoard
          initialTasks={moduleTasks}
          initialChecklists={allChecklists}
          projects={proj ? [{ id: proj.id, name: proj.name }] : []}
          modules={[
            { id: mod.id, name: mod.name, project_id: mod.project_id },
          ]}
          selectedProjectId={mod.project_id}
        />
      </div>

      {totalTasks === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-6 text-center">
          <ListTodo className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Belum ada tugas di modul ini</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tambahkan tugas dari halaman proyek atau langsung dari papan tugas.
          </p>
          {proj && (
            <Link
              href={`/projects/${proj.id}`}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Buka Halaman Proyek
            </Link>
          )}
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        Terakhir dilihat {formatDate(new Date(), "d MMM yyyy")} ·{" "}
        {formatDateRelative(mod.updated_at)}
      </p>
    </div>
  );
}

function ModuleStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
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
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:bg-accent/30">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${tones[tone]}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider leading-none text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-base font-semibold leading-none tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}
