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
          toast.success(project ? "Proyek diperbarui" : "Proyek dibuat");
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
        toast.error("Terjadi kesalahan");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nama Proyek</Label>
        <Input
          id="name"
          name="name"
          required
          autoFormat="title"
          defaultValue={project?.name}
          placeholder="mis. Redesign Landing Page Perusahaan"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          autoFormat="sentence"
          defaultValue={project?.description ?? ""}
          placeholder="Tujuan proyek, lingkup, sasaran..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Kategori</Label>
          <Select
            id="category"
            name="category"
            defaultValue={project?.category ?? "website"}
          >
            <option value="website">Website</option>
            <option value="application">Aplikasi</option>
            <option value="maintenance">Pemeliharaan</option>
            <option value="support">Dukungan</option>
            <option value="infrastructure">Infrastruktur</option>
            <option value="database">Basis Data</option>
            <option value="other">Lainnya</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            name="status"
            defaultValue={project?.status ?? "planning"}
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
            defaultValue={project?.priority ?? "medium"}
          >
            <option value="low">Rendah</option>
            <option value="medium">Sedang</option>
            <option value="high">Tinggi</option>
            <option value="urgent">Mendesak</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="deadline">Tenggat</Label>
          <Input
            id="deadline"
            name="deadline"
            type="date"
            defaultValue={project?.deadline ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Catatan Tambahan</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          autoFormat="sentence"
          defaultValue={project?.notes ?? ""}
          placeholder="Catatan implementasi, tautan, referensi..."
        />
      </div>

      <div className="flex items-center gap-2 border-t border-border pt-4">
        <Button type="submit" loading={isPending}>
          <Save className="h-4 w-4" />
          {project ? "Simpan Perubahan" : "Buat Proyek"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
