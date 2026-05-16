import Link from "next/link";
import { FolderX } from "lucide-react";

export default function ModuleNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FolderX className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">Modul tidak ditemukan</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Modul ini mungkin sudah dihapus atau memang tidak pernah ada.
      </p>
      <Link
        href="/board"
        className="mt-5 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Kembali ke Papan Tugas
      </Link>
    </div>
  );
}
