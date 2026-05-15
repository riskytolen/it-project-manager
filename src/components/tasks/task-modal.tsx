"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  createTask,
  deleteTask,
  updateTask,
} from "@/lib/actions/tasks";
import type { Task } from "@/types";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  task?: Task | null;
}

export function TaskModal({ open, onClose, projectId, task }: TaskModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    formData.set("project_id", projectId);
    setError(null);
    startTransition(async () => {
      const res = task
        ? await updateTask(task.id, formData)
        : await createTask(formData);
      if (res?.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success(task ? "Task updated" : "Task created");
        onClose();
      }
    });
  }

  function handleDelete() {
    if (!task) return;
    if (!confirm(`Delete task "${task.title}"?`)) return;
    startTransition(async () => {
      const res = await deleteTask(task.id, task.project_id);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Task deleted");
        onClose();
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? "Edit Task" : "Create Task"}
      description={
        task
          ? "Update task details, status, or deadline."
          : "Define a new task for this project."
      }
      size="lg"
    >
      <form action={handleSubmit} className="space-y-4 p-6">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={task?.title}
            placeholder="e.g. Implement authentication flow"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={task?.description ?? ""}
            placeholder="Details, acceptance criteria, references..."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              name="status"
              defaultValue={task?.status ?? "todo"}
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="testing">Testing</option>
              <option value="revision">Revision</option>
              <option value="done">Done</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="priority">Priority</Label>
            <Select
              id="priority"
              name="priority"
              defaultValue={task?.priority ?? "medium"}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              name="deadline"
              type="date"
              defaultValue={task?.deadline ?? ""}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={task?.notes ?? ""}
            placeholder="Optional implementation notes..."
          />
        </div>

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          {task ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4" />
              Delete
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
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              <Save className="h-4 w-4" />
              {task ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
