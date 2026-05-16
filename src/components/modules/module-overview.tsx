"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  FolderOpen,
  ListChecks,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn, projectStatusLabel } from "@/lib/utils";
import type { Module, Project, ProjectStatus, Task } from "@/types";

const STATUS_TONE: Record<ProjectStatus, string> = {
  planning: "border-slate-300/60 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40",
  ongoing: "border-sky-300/60 bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/40",
  pending: "border-amber-300/60 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40",
  completed: "border-emerald-300/60 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40",
  cancelled: "border-red-300/60 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40",
};

const STATUS_TEXT: Record<ProjectStatus, string> = {
  planning: "text-slate-700 dark:text-slate-300",
  ongoing: "text-sky-700 dark:text-sky-300",
  pending: "text-amber-700 dark:text-amber-300",
  completed: "text-emerald-700 dark:text-emerald-300",
  cancelled: "text-red-700 dark:text-red-300",
};

interface Props {
  modules: Module[];
  tasks: Task[];
  projects?: Pick<Project, "id" | "name">[];
  /** When set, link to /board?project=...&module=... */
  selectedProjectId?: string | null;
  /** Currently selected module id (for active styling) */
  selectedModuleId?: string | null;
  /** Optional title; defaults to "Modul" */
  title?: string;
}

export function ModuleOverview({
  modules,
  tasks,
  projects,
  selectedProjectId,
  selectedModuleId,
  title = "Modul",
}: Props) {
  // Filter modules to selected project if any
  const visibleModules = useMemo(() => {
    if (selectedProjectId && selectedProjectId !== "all") {
      return modules.filter((m) => m.project_id === selectedProjectId);
    }
    return modules;
  }, [modules, selectedProjectId]);

  // Tasks count by module
  const tasksByModule = useMemo(() => {
    const map = new Map<string, { total: number; done: number; doing: number }>();
    for (const t of tasks) {
      if (!t.module_id) continue;
      const cur = map.get(t.module_id) ?? { total: 0, done: 0, doing: 0 };
      cur.total++;
      if (t.status === "done") cur.done++;
      if (t.status === "in_progress") cur.doing++;
      map.set(t.module_id, cur);
    }
    return map;
  }, [tasks]);

  const projectMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of projects ?? []) m.set(p.id, p.name);
    return m;
  }, [projects]);

  if (visibleModules.length === 0) return null;

  // Aggregate stats
  const totalModules = visibleModules.length;
  const completedModules = visibleModules.filter(
    (m) => m.status === "completed",
  ).length;
  const ongoingModules = visibleModules.filter(
    (m) => m.status === "ongoing",
  ).length;
  const totalTaskInModules = visibleModules.reduce((s, m) => {
    const t = tasksByModule.get(m.id)?.total ?? 0;
    return s + t;
  }, 0);

  const allUrl = (mid: string) => {
    const p = new URLSearchParams();
    if (selectedProjectId && selectedProjectId !== "all") {
      p.set("project", selectedProjectId);
    }
    p.set("module", mid);
    return `/board?${p.toString()}`;
  };

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
            {totalModules}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Loader2 className="h-3 w-3 text-sky-600 dark:text-sky-400" />
            {ongoingModules} berjalan
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            {completedModules} selesai
          </span>
          <span className="hidden items-center gap-1 sm:inline-flex">
            <ListChecks className="h-3 w-3" />
            {totalTaskInModules} tugas
          </span>
        </div>
      </div>

      <div className="-mx-4 sm:-mx-6 lg:mx-0">
        <div
          className={cn(
            "grid gap-3 px-4 pb-1 sm:px-6 lg:px-0",
            "grid-flow-col auto-cols-[78%] overflow-x-auto scrollbar-thin snap-x snap-mandatory",
            "sm:auto-cols-[44%]",
            "md:auto-cols-[33%]",
            "lg:auto-cols-fr lg:grid-flow-row lg:grid-cols-3 lg:overflow-visible lg:snap-none",
            "xl:grid-cols-4",
          )}
        >
          {visibleModules.map((m) => {
            const stats = tasksByModule.get(m.id) ?? {
              total: 0,
              done: 0,
              doing: 0,
            };
            const isActive = selectedModuleId === m.id;
            return (
              <Link
                key={m.id}
                href={allUrl(m.id)}
                className={cn(
                  "group/mod relative snap-start overflow-hidden rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md",
                  isActive
                    ? "border-primary/60 ring-2 ring-primary/30"
                    : STATUS_TONE[m.status],
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {m.status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : m.status === "ongoing" ? (
                      <Loader2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    ) : (
                      <CircleDashed className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span
                      className={cn(
                        "text-[10px] font-semibold uppercase tracking-wider",
                        STATUS_TEXT[m.status],
                      )}
                    >
                      {projectStatusLabel[m.status]}
                    </span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 transition-transform group-hover/mod:translate-x-0.5" />
                </div>

                <h3 className="mt-2 truncate text-sm font-bold tracking-tight">
                  {m.name}
                </h3>

                {projectMap.size > 0 && projectMap.has(m.project_id) && (
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {projectMap.get(m.project_id)}
                  </p>
                )}

                {m.description && (
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                    {m.description}
                  </p>
                )}

                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <ListChecks className="h-2.5 w-2.5" />
                      {stats.done} dari {stats.total} selesai
                    </span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {m.progress}%
                    </span>
                  </div>
                  <Progress value={m.progress} size="sm" />
                </div>

                {(stats.doing > 0 || stats.total > stats.done) && (
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                    {stats.doing > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-1.5 py-0.5 font-medium text-sky-700 dark:text-sky-300">
                        <Loader2 className="h-2.5 w-2.5" />
                        {stats.doing} dikerjakan
                      </span>
                    )}
                    {stats.total - stats.done > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 font-medium">
                        {stats.total - stats.done} sisa
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
