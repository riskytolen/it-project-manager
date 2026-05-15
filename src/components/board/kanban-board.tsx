"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { toast } from "sonner";
import { CalendarDays, GripVertical, Pencil, Plus } from "lucide-react";
import { TaskModal } from "@/components/tasks/task-modal";
import {
  PriorityBadge,
} from "@/components/ui/status-badge";
import {
  cn,
  formatDate,
  isOverdue,
  taskStatusLabel,
} from "@/lib/utils";
import { updateTaskStatus } from "@/lib/actions/tasks";
import type { Project, Task, TaskStatus } from "@/types";

const COLUMNS: TaskStatus[] = [
  "todo",
  "in_progress",
  "testing",
  "revision",
  "done",
];

const COLUMN_COLORS: Record<TaskStatus, string> = {
  todo: "border-slate-300 dark:border-slate-700",
  in_progress: "border-blue-300 dark:border-blue-800",
  testing: "border-purple-300 dark:border-purple-800",
  revision: "border-amber-300 dark:border-amber-800",
  done: "border-emerald-300 dark:border-emerald-800",
};

const COLUMN_DOT: Record<TaskStatus, string> = {
  todo: "bg-slate-400",
  in_progress: "bg-blue-500",
  testing: "bg-purple-500",
  revision: "bg-amber-500",
  done: "bg-emerald-500",
};

interface Props {
  initialTasks: Task[];
  projects: Pick<Project, "id" | "name">[];
  selectedProjectId?: string;
}

export function KanbanBoard({
  initialTasks,
  projects,
  selectedProjectId,
}: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState<{ projectId: string } | null>(null);
  const [, startTransition] = useTransition();

  // Re-sync when server data changes
  useEffect(() => setTasks(initialTasks), [initialTasks]);

  const grouped = useMemo(() => {
    const out: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      testing: [],
      revision: [],
      done: [],
    };
    for (const t of tasks) out[t.status].push(t);
    return out;
  }, [tasks]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const newStatus = destination.droppableId as TaskStatus;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === draggableId
          ? {
              ...t,
              status: newStatus,
              progress: newStatus === "done" ? 100 : t.progress,
            }
          : t,
      ),
    );

    startTransition(async () => {
      const res = await updateTaskStatus(draggableId, newStatus);
      if (res?.error) {
        toast.error(res.error);
        setTasks(initialTasks);
      }
    });
  };

  const projectMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of projects) m.set(p.id, p.name);
    return m;
  }, [projects]);

  const defaultProjectIdForCreate =
    selectedProjectId && selectedProjectId !== "all"
      ? selectedProjectId
      : projects[0]?.id;

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {COLUMNS.map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex flex-col rounded-xl border-2 border-t-4 bg-muted/30 p-3 transition-colors",
                    COLUMN_COLORS[status],
                    snapshot.isDraggingOver && "bg-primary/5",
                  )}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn("h-2 w-2 rounded-full", COLUMN_DOT[status])}
                      />
                      <h3 className="text-xs font-semibold uppercase tracking-wide">
                        {taskStatusLabel[status]}
                      </h3>
                      <span className="rounded-full bg-card px-1.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                        {grouped[status].length}
                      </span>
                    </div>
                    {defaultProjectIdForCreate && (
                      <button
                        onClick={() =>
                          setCreating({ projectId: defaultProjectIdForCreate })
                        }
                        className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                        aria-label="Add task"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 min-h-[80px]">
                    {grouped[status].length === 0 && (
                      <p className="rounded-md border border-dashed border-border bg-card/50 py-4 text-center text-[11px] text-muted-foreground">
                        Drop tasks here
                      </p>
                    )}
                    {grouped[status].map((task, index) => {
                      const overdue = isOverdue(task.deadline, task.status);
                      return (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              className={cn(
                                "group rounded-lg border border-border bg-card p-3 shadow-sm transition-all",
                                snap.isDragging &&
                                  "rotate-1 shadow-lg ring-2 ring-primary",
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  {...prov.dragHandleProps}
                                  className="mt-0.5 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <GripVertical className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium leading-snug">
                                    {task.title}
                                  </p>
                                  {projectMap.get(task.project_id) && (
                                    <p className="mt-1 truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                                      {projectMap.get(task.project_id)}
                                    </p>
                                  )}
                                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                    <PriorityBadge priority={task.priority} />
                                    {task.deadline && (
                                      <span
                                        className={cn(
                                          "inline-flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px]",
                                          overdue &&
                                            "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
                                        )}
                                      >
                                        <CalendarDays className="h-2.5 w-2.5" />
                                        {formatDate(task.deadline, "MMM d")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => setEditing(task)}
                                  className="rounded-md p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground transition-opacity"
                                  aria-label="Edit"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <TaskModal
        open={!!editing}
        onClose={() => setEditing(null)}
        projectId={editing?.project_id ?? ""}
        task={editing}
      />
      {creating && (
        <TaskModal
          open
          onClose={() => setCreating(null)}
          projectId={creating.projectId}
        />
      )}
    </>
  );
}
