"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createProject, updateProject } from "@/lib/actions/projects";
import type { Project } from "@/types";

export function ProjectForm({ project }: { project?: Project }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const res = project
          ? await updateProject(project.id, formData)
          : await createProject(formData);
        if (res && "error" in res && res.error) {
          toast.error(res.error);
        } else {
          toast.success(project ? "Project updated" : "Project created");
        }
      } catch (e) {
        // redirect throws — this is expected on success
        if (
          e instanceof Error &&
          (e.message === "NEXT_REDIRECT" ||
            (e as { digest?: string }).digest?.startsWith?.("NEXT_REDIRECT"))
        ) {
          throw e;
        }
        toast.error("Something went wrong");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={project?.name}
          placeholder="e.g. Company Landing Page Redesign"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={project?.description ?? ""}
          placeholder="What this project is about, goals, scope..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            name="category"
            defaultValue={project?.category ?? "website"}
          >
            <option value="website">Website</option>
            <option value="application">Application</option>
            <option value="maintenance">Maintenance</option>
            <option value="support">Support</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="database">Database</option>
            <option value="other">Other</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            name="status"
            defaultValue={project?.status ?? "planning"}
          >
            <option value="planning">Planning</option>
            <option value="ongoing">Ongoing</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Select
            id="priority"
            name="priority"
            defaultValue={project?.priority ?? "medium"}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            name="deadline"
            type="date"
            defaultValue={project?.deadline ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={project?.notes ?? ""}
          placeholder="Implementation notes, links, references..."
        />
      </div>

      <div className="flex items-center gap-2 border-t border-border pt-4">
        <Button type="submit" loading={isPending}>
          <Save className="h-4 w-4" />
          {project ? "Save Changes" : "Create Project"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
