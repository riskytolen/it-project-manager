"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Check, X } from "lucide-react";
import {
  addChecklistItem,
  deleteChecklistItem,
  toggleChecklistItem,
} from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";
import type { TaskChecklist } from "@/types";

export function Checklist({
  taskId,
  items,
}: {
  taskId: string;
  items: TaskChecklist[];
}) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!text.trim()) return;
    startTransition(async () => {
      const res = await addChecklistItem(taskId, text);
      if (res.error) toast.error(res.error);
      else {
        setText("");
        setAdding(false);
      }
    });
  };

  const total = items.length;
  const done = items.filter((i) => i.is_done).length;

  return (
    <div className="space-y-2">
      {total > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Checklist</span>
          <span className="tabular-nums font-medium">
            {done}/{total}
          </span>
        </div>
      )}

      <ul className="space-y-1">
        {items.map((item) => (
          <li
            key={item.id}
            className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50"
          >
            <button
              type="button"
              onClick={() => {
                startTransition(async () => {
                  const res = await toggleChecklistItem(item.id, !item.is_done);
                  if (res.error) toast.error(res.error);
                });
              }}
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                item.is_done
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary",
              )}
              aria-label="Tandai"
            >
              {item.is_done && <Check className="h-3 w-3" />}
            </button>
            <span
              className={cn(
                "flex-1 text-sm",
                item.is_done && "text-muted-foreground line-through",
              )}
            >
              {item.content}
            </span>
            <button
              type="button"
              onClick={() => {
                startTransition(async () => {
                  const res = await deleteChecklistItem(item.id);
                  if (res.error) toast.error(res.error);
                });
              }}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
              aria-label="Hapus"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
              if (e.key === "Escape") {
                setAdding(false);
                setText("");
              }
            }}
            placeholder="Deskripsi item..."
            className="h-8 flex-1 rounded-md border border-input bg-background px-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isPending}
          />
          <button
            onClick={handleAdd}
            disabled={isPending || !text.trim()}
            className="inline-flex h-8 items-center rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            Tambah
          </button>
          <button
            onClick={() => {
              setAdding(false);
              setText("");
            }}
            className="inline-flex h-8 items-center rounded-md border border-border px-2.5 text-xs hover:bg-accent"
          >
            Batal
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <Plus className="h-3 w-3" />
          Tambah item checklist
        </button>
      )}
    </div>
  );
}
