import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectForm } from "@/components/projects/project-form";

export const metadata = {
  title: "Proyek Baru · IT Project Manager",
};

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 animate-fade-in">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke daftar proyek
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Buat Proyek</CardTitle>
          <CardDescription>
            Definisikan proyek IT baru untuk mulai melacak tugas dan progres.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm />
        </CardContent>
      </Card>
    </div>
  );
}
