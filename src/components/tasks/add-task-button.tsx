"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskModal } from "@/components/tasks/task-modal";
import type { Module } from "@/types";

export function AddTaskButton({
  projectId,
  modules,
}: {
  projectId: string;
  modules?: Pick<Module, "id" | "name">[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Tambah Tugas
      </Button>
      <TaskModal
        open={open}
        onClose={() => setOpen(false)}
        projectId={projectId}
        modules={modules}
      />
    </>
  );
}
