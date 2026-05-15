import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectForm } from "@/components/projects/project-form";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5 animate-fade-in">
      <Link
        href={`/projects/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke proyek
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit Proyek</CardTitle>
          <CardDescription>Perbarui detail dan pengaturan proyek.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm project={project as Project} />
        </CardContent>
      </Card>
    </div>
  );
}
