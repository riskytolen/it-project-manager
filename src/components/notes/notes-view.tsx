"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bell,
  Bug,
  FileCode2,
  Lightbulb,
  NotebookPen,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import {
  cn,
  formatDateRelative,
  noteCategoryLabel,
} from "@/lib/utils";
import {
  createNote,
  deleteNote,
  togglePinNote,
  updateNote,
} from "@/lib/actions/notes";
import type { Note, NoteCategory, Project } from "@/types";

const ICONS: Record<NoteCategory, typeof Bug> = {
  bug: Bug,
  feature_idea: Lightbulb,
  documentation: FileCode2,
  maintenance: Wrench,
  reminder: Bell,
  general: NotebookPen,
};

const CATEGORY_COLORS: Record<NoteCategory, string> = {
  bug: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  feature_idea: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  documentation: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  maintenance: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  reminder: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  general: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

interface Props {
  notes: Note[];
  projects: Pick<Project, "id" | "name">[];
  defaultQuery?: string;
  defaultCategory?: string;
}

export function NotesView({
  notes,
  projects,
  defaultQuery,
  defaultCategory,
}: Props) {
  const [editing, setEditing] = useState<Note | "new" | null>(null);
  const [isPending, startTransition] = useTransition();

  const handlePin = (note: Note) => {
    startTransition(async () => {
      const res = await togglePinNote(note.id, !note.is_pinned);
      if (res.error) toast.error(res.error);
    });
  };

  const handleDelete = (note: Note) => {
    if (!confirm(`Delete note "${note.title}"?`)) return;
    startTransition(async () => {
      const res = await deleteNote(note.id);
      if (res.error) toast.error(res.error);
      else toast.success("Note deleted");
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-sm text-muted-foreground">
            Bugs, ideas, documentation, and reminders in one place
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" />
          New Note
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form className="grid gap-3 sm:grid-cols-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                name="q"
                defaultValue={defaultQuery}
                placeholder="Search notes..."
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <select
              name="category"
              defaultValue={defaultCategory ?? "all"}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
            >
              <option value="all">All Categories</option>
              <option value="bug">Bug</option>
              <option value="feature_idea">Feature Idea</option>
              <option value="documentation">Documentation</option>
              <option value="maintenance">Maintenance</option>
              <option value="reminder">Reminder</option>
              <option value="general">General</option>
            </select>
            <div className="flex gap-2 sm:col-span-3">
              <Button type="submit" size="sm">
                Apply
              </Button>
              <Link
                href="/notes"
                className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs hover:bg-accent"
              >
                Reset
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {notes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No notes yet"
          description="Capture bugs, ideas, documentation, and reminders to keep your work organized."
          action={
            <Button onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" />
              Create First Note
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => {
            const Icon = ICONS[note.category];
            const project = projects.find((p) => p.id === note.project_id);
            return (
              <Card
                key={note.id}
                className={cn(
                  "group relative",
                  note.is_pinned && "border-primary/40 bg-primary/[0.03]",
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                        CATEGORY_COLORS[note.category],
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {noteCategoryLabel[note.category]}
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handlePin(note)}
                        disabled={isPending}
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                        aria-label={note.is_pinned ? "Unpin" : "Pin"}
                      >
                        {note.is_pinned ? (
                          <PinOff className="h-3.5 w-3.5" />
                        ) : (
                          <Pin className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => setEditing(note)}
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(note)}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <CardTitle className="flex items-center gap-1.5">
                    {note.is_pinned && (
                      <Pin className="h-3.5 w-3.5 fill-primary text-primary" />
                    )}
                    {note.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {note.content && (
                    <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">
                      {note.content}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    {project ? (
                      <Link
                        href={`/projects/${project.id}`}
                        className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] hover:bg-accent"
                      >
                        {project.name}
                      </Link>
                    ) : (
                      <span />
                    )}
                    <span>{formatDateRelative(note.updated_at)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <NoteModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        note={editing && editing !== "new" ? editing : null}
        projects={projects}
      />
    </div>
  );
}

interface NoteModalProps {
  open: boolean;
  onClose: () => void;
  note: Note | null;
  projects: Pick<Project, "id" | "name">[];
}

function NoteModal({ open, onClose, note, projects }: NoteModalProps) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = note
        ? await updateNote(note.id, formData)
        : await createNote(formData);
      if (res?.error) toast.error(res.error);
      else {
        toast.success(note ? "Note updated" : "Note created");
        onClose();
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={note ? "Edit Note" : "Create Note"}
      size="lg"
    >
      <form action={handleSubmit} className="space-y-4 p-6">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={note?.title}
            placeholder="e.g. Fix login redirect on iOS Safari"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              name="category"
              defaultValue={note?.category ?? "general"}
            >
              <option value="bug">Bug</option>
              <option value="feature_idea">Feature Idea</option>
              <option value="documentation">Documentation</option>
              <option value="maintenance">Maintenance</option>
              <option value="reminder">Reminder</option>
              <option value="general">General</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project_id">Linked Project</Label>
            <Select
              id="project_id"
              name="project_id"
              defaultValue={note?.project_id ?? ""}
            >
              <option value="">— None —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            name="content"
            rows={8}
            defaultValue={note?.content ?? ""}
            placeholder="Write your note... Markdown-style line breaks preserved."
          />
        </div>

        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            name="is_pinned"
            defaultChecked={note?.is_pinned}
            className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
          />
          <span className="text-sm">Pin this note</span>
        </label>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {note ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
