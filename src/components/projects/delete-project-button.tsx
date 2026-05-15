"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProject } from "@/lib/actions/projects";

export function DeleteProjectButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (
      !confirm(
        `Delete project "${name}"? This will permanently remove all its tasks and files.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await deleteProject(id);
      if (res && "error" in res && res.error) {
        toast.error(res.error);
      } else {
        toast.success("Project deleted");
        router.push("/projects");
        router.refresh();
      }
    });
  };

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      loading={isPending}
    >
      <Trash2 className="h-4 w-4" />
      Delete
    </Button>
  );
}
