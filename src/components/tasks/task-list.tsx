"use client";

import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  ListChecks,
  Pencil,
} from "lucide-react";
import {
  PriorityBadge,
  TaskStatusBadge,
} from "@/components/ui/status-badge";
import { Checklist } from "@/components/tasks/checklist";
import { TaskModal } from "@/components/tasks/task-modal";
import {
  cn,
  formatDate,
  isOverdue,
} from "@/lib/utils";
import type { Module, Task, TaskChecklist } from "@/types";

type TaskWithChecklist = Task & {
  task_checklists?: TaskChecklist[];
};

interface Props {
  projectId: string;
  tasks: TaskWithChecklist[];
  /** Modules in this project; passed to TaskModal so users can change a task's module */
  modules?: Pick<Module, "id" | "name">[];
}

export function TaskList({ projectId, tasks, modules }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
        <ListChecks className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Belum ada tugas</p>
        <p className="text-xs text-muted-foreground">
          Tambahkan tugas pertama untuk mulai melacak pekerjaan.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {tasks.map((task) => {
          const items = task.task_checklists ?? [];
          const isExpanded = expandedId === task.id;
          const overdue = isOverdue(task.deadline, task.status);
          return (
            <li
              key={task.id}
              className="rounded-lg border border-border bg-card transition-colors"
            >
              <div className="flex items-center gap-3 p-3">
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : task.id)
                  }
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label={isExpanded ? "Tutup" : "Buka"}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <TaskStatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                    {task.deadline && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1",
                          overdue && "text-red-600 dark:text-red-400 font-medium",
                        )}
                      >
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(task.deadline, "d MMM yyyy")}
                      </span>
                    )}
                    {items.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <ListChecks className="h-3 w-3" />
                        {items.filter((i) => i.is_done).length}/{items.length}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setEditing(task)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Edit tugas"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>

              {isExpanded && (
                <div className="space-y-3 border-t border-border bg-muted/30 p-4 animate-slide-down">
                  {task.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {task.description}
                    </p>
                  )}
                  {task.notes && (
                    <div className="rounded-md border border-border bg-card p-3 text-xs">
                      <p className="font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                        Catatan
                      </p>
                      <p className="whitespace-pre-wrap">{task.notes}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Diperbarui {formatDate(task.updated_at, "d MMM, HH:mm")}
                    </span>
                  </div>
                  <Checklist taskId={task.id} items={items} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <TaskModal
        open={!!editing}
        onClose={() => setEditing(null)}
        projectId={projectId}
        task={editing}
        modules={modules}
      />
    </>
  );
}
