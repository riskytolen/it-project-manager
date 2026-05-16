"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  ListChecks,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  PriorityBadge,
  ProjectStatusBadge,
} from "@/components/ui/status-badge";
import { TaskList } from "@/components/tasks/task-list";
import { TaskModal } from "@/components/tasks/task-modal";
import { cn } from "@/lib/utils";
import {
  createModule,
  deleteModule,
  updateModule,
} from "@/lib/actions/modules";
import type { Module, Task, TaskChecklist } from "@/types";

type TaskWithChecklist = Task & {
  task_checklists?: TaskChecklist[];
};

interface Props {
  projectId: string;
  modules: Module[];
  tasks: TaskWithChecklist[];
}

export function ProjectModules({ projectId, modules, tasks }: Props) {
  const [editingModule, setEditingModule] = useState<Module | "new" | null>(
    null,
  );
  const [creatingTaskFor, setCreatingTaskFor] = useState<{
    moduleId: string | null;
  } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    // expand all by default for first impression
    for (const m of modules) out[m.id] = true;
    out["__none__"] = true;
    return out;
  });

  const tasksByModule = useMemo(() => {
    const map = new Map<string, TaskWithChecklist[]>();
    for (const t of tasks) {
      const key = t.module_id ?? "__none__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [tasks]);

  const tasksWithoutModule = tasksByModule.get("__none__") ?? [];

  const toggle = (id: string) =>
    setExpanded((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="space-y-4">
      {/* Compact stats + primary action */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <FolderOpen className="h-3.5 w-3.5 text-primary" />
            <span className="tabular-nums">{modules.length}</span>
            <span className="text-muted-foreground">modul</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <ListChecks className="h-3.5 w-3.5" />
            <span className="tabular-nums">{tasks.length}</span>
            <span>tugas</span>
          </span>
          {tasksWithoutModule.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span className="tabular-nums">{tasksWithoutModule.length}</span>
              <span>tanpa modul</span>
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => setEditingModule("new")}>
          <Plus className="h-4 w-4" />
          Tambah Modul
        </Button>
      </div>

      {modules.length === 0 && tasksWithoutModule.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-6 text-center">
          <Folder className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Belum ada modul</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Bagi proyek menjadi modul (mis. Penggajian, Kinerja, Data Pajak)
            untuk merapikan tugas.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {modules.map((m) => {
          const moduleTasks = tasksByModule.get(m.id) ?? [];
          const isOpen = expanded[m.id] ?? true;
          return (
            <div
              key={m.id}
              className="overflow-hidden rounded-xl border border-border bg-card transition-all"
            >
              <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/20 p-3">
                <button
                  type="button"
                  onClick={() => toggle(m.id)}
                  className="flex flex-1 items-start gap-2 text-left transition-colors hover:opacity-90"
                >
                  <span className="mt-0.5 rounded-md p-1 text-muted-foreground">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold tracking-tight">
                        {m.name}
                      </h4>
                      <ProjectStatusBadge status={m.status} />
                      <PriorityBadge priority={m.priority} />
                    </div>
                    {m.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {m.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={m.progress} size="sm" className="flex-1" />
                      <span className="shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground">
                        {moduleTasks.length} tugas · {m.progress}%
                      </span>
                    </div>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingModule(m)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    aria-label="Edit modul"
                    title="Edit modul"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="space-y-3 p-3 animate-slide-down">
                  {moduleTasks.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border/60 bg-background/40 p-5 text-center">
                      <ListChecks className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground/70" />
                      <p className="text-xs font-medium">Belum ada tugas</p>
                      <p className="text-[11px] text-muted-foreground">
                        Tambahkan tugas pertama untuk modul{" "}
                        <span className="font-medium">{m.name}</span>.
                      </p>
                      <button
                        type="button"
                        onClick={() => setCreatingTaskFor({ moduleId: m.id })}
                        className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium hover:bg-accent"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Tambah Tugas ke Modul Ini
                      </button>
                    </div>
                  ) : (
                    <>
                      <TaskList
                        projectId={projectId}
                        tasks={moduleTasks}
                        modules={modules}
                      />
                      <button
                        type="button"
                        onClick={() => setCreatingTaskFor({ moduleId: m.id })}
                        className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/50 hover:text-foreground"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Tambah Tugas ke {m.name}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Tasks without a module */}
        {tasksWithoutModule.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-dashed border-border bg-card/40">
            <button
              type="button"
              onClick={() => toggle("__none__")}
              className="flex w-full items-center gap-2 border-b border-dashed border-border bg-muted/10 p-3 text-left"
            >
              <span className="rounded-md p-1 text-muted-foreground">
                {expanded["__none__"] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">Tanpa Modul</p>
                <p className="text-[11px] text-muted-foreground">
                  Tugas yang belum dikelompokkan ke modul (
                  {tasksWithoutModule.length})
                </p>
              </div>
            </button>
            {expanded["__none__"] && (
              <div className="space-y-3 p-3 animate-slide-down">
                <TaskList
                  projectId={projectId}
                  tasks={tasksWithoutModule}
                  modules={modules}
                />
                <button
                  type="button"
                  onClick={() => setCreatingTaskFor({ moduleId: null })}
                  className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/50 hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Tugas Tanpa Modul
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ModuleModal
        open={editingModule !== null}
        onClose={() => setEditingModule(null)}
        module={editingModule && editingModule !== "new" ? editingModule : null}
        projectId={projectId}
      />

      {creatingTaskFor && (
        <TaskModal
          open
          onClose={() => setCreatingTaskFor(null)}
          projectId={projectId}
          modules={modules}
          defaultModuleId={creatingTaskFor.moduleId}
        />
      )}
    </div>
  );
}

interface ModuleModalProps {
  open: boolean;
  onClose: () => void;
  module: Module | null;
  projectId: string;
}

function ModuleModal({ open, onClose, module, projectId }: ModuleModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    formData.set("project_id", projectId);
    setError(null);
    startTransition(async () => {
      const res = module
        ? await updateModule(module.id, formData)
        : await createModule(formData);
      if (res?.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success(module ? "Modul diperbarui" : "Modul dibuat");
        onClose();
      }
    });
  }

  function handleDelete() {
    if (!module) return;
    if (
      !confirm(
        `Hapus modul "${module.name}"? Tugas di dalamnya tidak akan dihapus, hanya kehilangan tautan modul.`,
      )
    )
      return;
    startTransition(async () => {
      const res = await deleteModule(module.id, projectId);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Modul dihapus");
        onClose();
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={module ? "Edit Modul" : "Tambah Modul"}
      description={
        module
          ? "Perbarui informasi modul / bagian proyek."
          : "Buat bagian proyek (mis. Penggajian, Kinerja, Data Pajak)."
      }
      size="md"
    >
      <form action={handleSubmit} className="space-y-4 p-6">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama Modul</Label>
          <Input
            id="name"
            name="name"
            required
            autoFormat="title"
            defaultValue={module?.name}
            placeholder="mis. Penggajian"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea
            id="description"
            name="description"
            rows={2}
            autoFormat="sentence"
            defaultValue={module?.description ?? ""}
            placeholder="Cakupan singkat modul ini..."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              name="status"
              defaultValue={module?.status ?? "planning"}
            >
              <option value="planning">Perencanaan</option>
              <option value="ongoing">Berjalan</option>
              <option value="pending">Tertunda</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priority">Prioritas</Label>
            <Select
              id="priority"
              name="priority"
              defaultValue={module?.priority ?? "medium"}
            >
              <option value="low">Rendah</option>
              <option value="medium">Sedang</option>
              <option value="high">Tinggi</option>
              <option value="urgent">Mendesak</option>
            </Select>
          </div>
        </div>

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          {module ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4" />
              Hapus
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
              Batal
            </Button>
            <Button type="submit" loading={isPending}>
              <Save className="h-4 w-4" />
              {module ? "Simpan" : "Buat"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// Re-export so usage site can import unused icon-less helpers
export { cn };
