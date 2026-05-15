"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Download, Trash2, Upload, FileIcon } from "lucide-react";
import { deleteFile, getFileUrl, uploadFile } from "@/lib/actions/files";
import { formatBytes, formatDateRelative } from "@/lib/utils";
import type { FileRecord } from "@/types";

interface Props {
  projectId?: string;
  files: FileRecord[];
  showProject?: boolean;
}

export function ProjectAttachments({ projectId, files, showProject }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleUpload = (file: File) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    if (projectId) fd.append("project_id", projectId);

    startTransition(async () => {
      const res = await uploadFile(fd);
      if (res.error) toast.error(res.error);
      else toast.success("Berkas diunggah");
    });
  };

  const handleDownload = async (id: string, path: string) => {
    setDownloadingId(id);
    try {
      const url = await getFileUrl(path);
      if (url) window.open(url, "_blank");
      else toast.error("Gagal membuat tautan unduh");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = (id: string, path: string, name: string) => {
    if (!confirm(`Hapus berkas "${name}"?`)) return;
    startTransition(async () => {
      const res = await deleteFile(id, path);
      if (res.error) toast.error(res.error);
      else toast.success("Berkas dihapus");
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card px-3 py-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          {isPending ? "Mengunggah..." : "Klik untuk mengunggah"}
        </button>
      </div>

      {files.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-2">
          Belum ada lampiran.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li
              key={f.id}
              className="group flex items-center gap-2 rounded-md border border-border bg-card p-2.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{f.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatBytes(f.size)} · {formatDateRelative(f.created_at)}
                  {showProject && f.project_id && " · terlampir di proyek"}
                </p>
              </div>
              <button
                onClick={() => handleDownload(f.id, f.path)}
                disabled={downloadingId === f.id}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Unduh"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDelete(f.id, f.path, f.name)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Hapus"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
