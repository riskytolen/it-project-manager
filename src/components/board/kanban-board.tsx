"use client";

import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { toast } from "sonner";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  ClipboardCheck,
  FlaskConical,
  ListChecks,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCcw,
} from "lucide-react";
import { TaskModal } from "@/components/tasks/task-modal";
import {
  cn,
  formatDate,
  isOverdue,
  taskStatusLabel,
} from "@/lib/utils";
import { updateTaskStatus } from "@/lib/actions/tasks";
import type {
  Priority,
  Project,
  Task,
  TaskChecklist,
  TaskStatus,
} from "@/types";

const COLUMNS: TaskStatus[] = [
  "todo",
  "in_progress",
  "testing",
  "revision",
  "done",
];

interface ColumnTheme {
  icon: typeof ListChecks;
  headerBg: string;
  accent: string;
  stripe: string;
  dragOver: string;
  /** tab pill colors (mobile) */
  tabActive: string;
}

const COLUMN_THEMES: Record<TaskStatus, ColumnTheme> = {
  todo: {
    icon: CircleDashed,
    headerBg: "from-slate-500/10 to-transparent",
    accent: "text-slate-600 dark:text-slate-300 bg-slate-500/10",
    stripe: "bg-slate-400",
    dragOver: "ring-slate-400/40 bg-slate-500/5",
    tabActive: "bg-slate-500/15 text-slate-700 dark:text-slate-200",
  },
  in_progress: {
    icon: Loader2,
    headerBg: "from-sky-500/10 to-transparent",
    accent: "text-sky-700 dark:text-sky-300 bg-sky-500/10",
    stripe: "bg-sky-500",
    dragOver: "ring-sky-400/50 bg-sky-500/5",
    tabActive: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  },
  testing: {
    icon: FlaskConical,
    headerBg: "from-violet-500/10 to-transparent",
    accent: "text-violet-700 dark:text-violet-300 bg-violet-500/10",
    stripe: "bg-violet-500",
    dragOver: "ring-violet-400/50 bg-violet-500/5",
    tabActive: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  },
  revision: {
    icon: RefreshCcw,
    headerBg: "from-amber-500/10 to-transparent",
    accent: "text-amber-700 dark:text-amber-300 bg-amber-500/10",
    stripe: "bg-amber-500",
    dragOver: "ring-amber-400/50 bg-amber-500/5",
    tabActive: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  done: {
    icon: ClipboardCheck,
    headerBg: "from-emerald-500/10 to-transparent",
    accent: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10",
    stripe: "bg-emerald-500",
    dragOver: "ring-emerald-400/50 bg-emerald-500/5",
    tabActive: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
};

const PRIORITY_STRIPE: Record<Priority, string> = {
  low: "bg-slate-400",
  medium: "bg-sky-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const PRIORITY_LABEL_SHORT: Record<Priority, string> = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
  urgent: "Mendesak",
};

const PRIORITY_PILL: Record<Priority, string> = {
  low:
    "border-slate-300/60 text-slate-600 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
  medium:
    "border-sky-300/60 text-sky-700 bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
  high:
    "border-orange-300/60 text-orange-700 bg-orange-50 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300",
  urgent:
    "border-red-300/60 text-red-700 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
};

interface Props {
  initialTasks: Task[];
  initialChecklists?: TaskChecklist[];
  projects: Pick<Project, "id" | "name">[];
  selectedProjectId?: string;
}

export function KanbanBoard({
  initialTasks,
  initialChecklists = [],
  projects,
  selectedProjectId,
}: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState<{
    projectId: string;
    status?: TaskStatus;
  } | null>(null);
  const [mobileTab, setMobileTab] = useState<TaskStatus>("todo");
  const tabsRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

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

  const checklistByTask = useMemo(() => {
    const map = new Map<string, TaskChecklist[]>();
    for (const c of initialChecklists) {
      if (!map.has(c.task_id)) map.set(c.task_id, []);
      map.get(c.task_id)!.push(c);
    }
    return map;
  }, [initialChecklists]);

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
      } else {
        toast.success(`Tugas dipindah ke ${taskStatusLabel[newStatus]}`);
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

  const renderColumn = (status: TaskStatus, mobile = false) => {
    const theme = COLUMN_THEMES[status];
    const ColIcon = theme.icon;
    const items = grouped[status];

    return (
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "group/col relative flex flex-col rounded-xl border border-border bg-card/50 transition-all",
              mobile
                ? "w-full"
                : [
                    "w-[78vw] min-w-[260px] max-w-[320px] shrink-0 snap-start",
                    "sm:w-[60vw] sm:max-w-[340px]",
                    "md:w-[42vw] md:max-w-[360px]",
                    "xl:w-auto xl:min-w-0 xl:max-w-none xl:shrink",
                  ],
              snapshot.isDraggingOver &&
                `ring-2 ring-offset-2 ring-offset-background ${theme.dragOver}`,
            )}
          >
            <div className={cn("h-1 w-full rounded-t-xl", theme.stripe)} />

            <div
              className={cn(
                "flex items-center justify-between gap-2 rounded-b-md bg-gradient-to-b px-3.5 pt-3 pb-3",
                theme.headerBg,
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md",
                    theme.accent,
                  )}
                >
                  <ColIcon
                    className={cn(
                      "h-3.5 w-3.5",
                      status === "in_progress" && "animate-spin-slow",
                    )}
                  />
                </span>
                <div className="flex flex-col leading-tight">
                  <h3 className="text-[13px] font-semibold tracking-tight">
                    {taskStatusLabel[status]}
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {items.length} tugas
                  </span>
                </div>
              </div>

              {defaultProjectIdForCreate && (
                <button
                  onClick={() =>
                    setCreating({
                      projectId: defaultProjectIdForCreate,
                      status,
                    })
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-accent hover:text-foreground hover:scale-105 active:scale-95"
                  aria-label="Tambah tugas"
                  title={`Tambah tugas ke ${taskStatusLabel[status]}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>

            <div
              className={cn(
                "flex-1 space-y-2.5 px-2.5 pb-2.5 pt-1.5",
                mobile ? "min-h-[280px]" : "min-h-[140px]",
              )}
            >
              {items.length === 0 && (
                <div
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border/60 bg-background/40 py-8 text-center transition-colors",
                    snapshot.isDraggingOver &&
                      "border-primary/50 bg-primary/5",
                  )}
                >
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {snapshot.isDraggingOver
                      ? "Lepaskan di sini"
                      : "Tidak ada tugas"}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">
                    {mobile
                      ? "Tap + untuk menambah"
                      : "Seret kartu ke kolom ini"}
                  </p>
                </div>
              )}

              {items.map((task, index) => (
                <Draggable
                  key={task.id}
                  draggableId={task.id}
                  index={index}
                >
                  {(prov, snap) => (
                    <TaskCard
                      ref={prov.innerRef}
                      draggableProps={prov.draggableProps}
                      dragHandleProps={prov.dragHandleProps ?? null}
                      task={task}
                      isDragging={snap.isDragging}
                      projectName={projectMap.get(task.project_id)}
                      checklist={checklistByTask.get(task.id) ?? []}
                      onEdit={() => setEditing(task)}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    );
  };

  const scrollTabs = (dir: "left" | "right") => {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        {/* ============== MOBILE VIEW (< md): tabs + single column ============== */}
        <div className="md:hidden space-y-3">
          {/* Status tabs */}
          <div className="relative">
            <button
              type="button"
              onClick={() => scrollTabs("left")}
              className="absolute left-0 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm sm:flex"
              aria-label="Geser kiri"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div
              ref={tabsRef}
              className="flex gap-1.5 overflow-x-auto scrollbar-thin py-1 sm:px-9"
            >
              {COLUMNS.map((s) => {
                const theme = COLUMN_THEMES[s];
                const Icon = theme.icon;
                const count = grouped[s].length;
                const active = s === mobileTab;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setMobileTab(s)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95",
                      active
                        ? cn("border-transparent shadow-sm", theme.tabActive)
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5",
                        s === "in_progress" && active && "animate-spin-slow",
                      )}
                    />
                    {taskStatusLabel[s]}
                    <span
                      className={cn(
                        "ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] tabular-nums",
                        active
                          ? "bg-background/60"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => scrollTabs("right")}
              className="absolute right-0 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm sm:flex"
              aria-label="Geser kanan"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Active column */}
          <div className="animate-fade-in">{renderColumn(mobileTab, true)}</div>

          <p className="text-center text-[11px] text-muted-foreground">
            💡 Tap kartu 2x atau ikon pensil untuk mengubah status tugas
          </p>
        </div>

        {/* ============== TABLET / DESKTOP VIEW (>= md) ============== */}
        <div className="hidden md:block">
          <div className="-mx-4 sm:-mx-6 lg:mx-0">
            <div
              className={cn(
                "px-4 pb-2 sm:px-6 lg:px-0",
                "flex gap-3 overflow-x-auto scrollbar-thin snap-x snap-mandatory",
                "xl:grid xl:grid-cols-5 xl:gap-4 xl:overflow-visible xl:snap-none",
              )}
            >
              {COLUMNS.map((s) => (
                <div key={s} className="contents">
                  {renderColumn(s, false)}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-2 text-center text-[11px] text-muted-foreground xl:hidden">
            ← Geser untuk melihat kolom lain →
          </p>
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

interface TaskCardProps {
  task: Task;
  isDragging: boolean;
  projectName?: string;
  checklist: TaskChecklist[];
  onEdit: () => void;
  draggableProps: React.HTMLAttributes<HTMLDivElement>;
  dragHandleProps: React.HTMLAttributes<HTMLDivElement> | null;
}

const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(function TaskCard(
  {
    task,
    isDragging,
    projectName,
    checklist,
    onEdit,
    draggableProps,
    dragHandleProps,
  },
  ref,
) {
  const overdue = isOverdue(task.deadline, task.status);
  const done = checklist.filter((c) => c.is_done).length;
  const total = checklist.length;
  const checklistPercent = total === 0 ? 0 : Math.round((done / total) * 100);
  const stripe = PRIORITY_STRIPE[task.priority];

  return (
    <div
      ref={ref}
      {...draggableProps}
      {...(dragHandleProps ?? {})}
      onDoubleClick={onEdit}
      className={cn(
        "group/card relative cursor-grab overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all active:cursor-grabbing",
        "hover:border-primary/40 hover:shadow-md",
        isDragging &&
          "rotate-1 shadow-2xl ring-2 ring-primary/60 scale-[1.02]",
      )}
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-1", stripe)}
        aria-hidden="true"
      />

      <div className="px-3.5 py-3 pl-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                PRIORITY_PILL[task.priority],
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", stripe)} />
              {PRIORITY_LABEL_SHORT[task.priority]}
            </span>
            {overdue && (
              <span className="inline-flex items-center gap-1 rounded-md border border-red-300/60 bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-2.5 w-2.5" />
                Terlambat
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="rounded-md p-1 text-muted-foreground transition-all hover:bg-accent hover:text-foreground md:opacity-0 md:group-hover/card:opacity-100"
            aria-label="Edit tugas"
            tabIndex={-1}
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>

        <h4
          className={cn(
            "mt-2 text-sm font-semibold leading-snug text-foreground",
            task.status === "done" && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </h4>

        {task.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/90">
            {task.description}
          </p>
        )}

        {total > 0 && (
          <div className="mt-2.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ListChecks className="h-3 w-3" />
                Checklist
              </span>
              <span className="tabular-nums">
                {done}/{total}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  checklistPercent === 100 ? "bg-emerald-500" : "bg-primary",
                )}
                style={{ width: `${checklistPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/50 pt-2.5">
          {projectName ? (
            <span className="inline-flex max-w-[60%] items-center gap-1 truncate rounded-md bg-secondary/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
              <span className="truncate">{projectName}</span>
            </span>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            {task.notes && (
              <span
                title="Punya catatan"
                className="text-muted-foreground/70"
              >
                <MessageSquare className="h-3 w-3" />
              </span>
            )}
            {task.deadline && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium",
                  overdue
                    ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                    : "bg-secondary/80",
                )}
              >
                <CalendarDays className="h-3 w-3" />
                {formatDate(task.deadline, "d MMM")}
              </span>
            )}
            {task.status === "done" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-700 dark:text-emerald-400">
                <Check className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
