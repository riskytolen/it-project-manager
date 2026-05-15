import { FolderX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FolderX className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">Project not found</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This project may have been deleted or never existed.
      </p>
      <Link
        href="/projects"
        className="mt-5 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Back to projects
      </Link>
    </div>
  );
}
