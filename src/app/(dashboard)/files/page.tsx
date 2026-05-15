import { Files, FolderOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectAttachments } from "@/components/projects/project-attachments";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBytes } from "@/lib/utils";
import type { FileRecord, Project } from "@/types";

export const dynamic = "force-dynamic";

export default async function FilesPage() {
  const supabase = await createClient();
  const [{ data: files }, { data: projects }] = await Promise.all([
    supabase.from("files").select("*").order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name"),
  ]);

  const all = (files ?? []) as FileRecord[];
  const allProjects = (projects ?? []) as Pick<Project, "id" | "name">[];

  const totalSize = all.reduce((s, f) => s + f.size, 0);

  // group by mime
  const byType = {
    image: all.filter((f) => f.mime_type?.startsWith("image/")),
    document: all.filter(
      (f) =>
        f.mime_type?.includes("pdf") ||
        f.mime_type?.includes("word") ||
        f.mime_type?.includes("text") ||
        f.mime_type?.includes("spreadsheet"),
    ),
    other: all.filter(
      (f) =>
        !f.mime_type?.startsWith("image/") &&
        !f.mime_type?.includes("pdf") &&
        !f.mime_type?.includes("word") &&
        !f.mime_type?.includes("text") &&
        !f.mime_type?.includes("spreadsheet"),
    ),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Files</h1>
        <p className="text-sm text-muted-foreground">
          All attachments across your projects and tasks
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Total Files
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {all.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Storage Used
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatBytes(totalSize)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Images
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {byType.image.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Documents
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {byType.document.length}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Files className="h-5 w-5 text-primary" />
            All Files
          </CardTitle>
          <CardDescription>
            Upload files to attach them to projects from the project detail page
          </CardDescription>
        </CardHeader>
        <CardContent>
          {all.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No files uploaded yet"
              description="Files uploaded to projects will appear here. You can also upload directly below."
            />
          ) : null}
          <ProjectAttachments files={all} showProject />

          {allProjects.length > 0 && all.length > 0 && (
            <div className="mt-4 rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              Tip: Use the upload button above to add a file to your global
              storage. To link a file to a specific project, upload from that
              project&apos;s detail page.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
