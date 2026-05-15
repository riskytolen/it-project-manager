"use client";

import { Menu, Search, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const q = (data.get("q") as string)?.trim();
          if (q) {
            router.push(`/projects?q=${encodeURIComponent(q)}`);
          }
        }}
        className="relative flex flex-1 items-center"
      >
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          name="q"
          type="search"
          placeholder="Search projects, tasks, notes..."
          className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent sm:max-w-md"
        />
      </form>

      <ThemeToggle />

      <Link
        href="/projects/new"
        className="hidden sm:inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" />
        New Project
      </Link>
    </header>
  );
}
