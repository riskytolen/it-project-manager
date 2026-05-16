"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  KanbanSquare,
  CalendarDays,
  StickyNote,
  Files,
  Settings,
  Code2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dasbor", href: "/dashboard", icon: LayoutDashboard },
  { name: "Proyek", href: "/projects", icon: FolderKanban },
  { name: "Papan Tugas", href: "/board", icon: KanbanSquare },
  { name: "Kalender", href: "/calendar", icon: CalendarDays },
  { name: "Catatan", href: "/notes", icon: StickyNote },
  { name: "Berkas", href: "/files", icon: Files },
  { name: "Pengaturan", href: "/settings", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-600 to-orange-800 text-white shadow-sm transition-transform group-hover:scale-105">
              <Code2 className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">
                IT Manager
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Ruang kerja pribadi
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden rounded-md p-1.5 text-muted-foreground hover:bg-accent"
            aria-label="Tutup sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto scrollbar-thin p-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary" />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isActive && "scale-110",
                  )}
                  strokeWidth={isActive ? 2.4 : 2}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3">
          {/* Developer card */}
          <div className="group relative overflow-hidden rounded-lg border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-amber-500/10 p-3 transition-all hover:border-orange-500/40 hover:shadow-md">
            <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-orange-500/10 blur-xl" />
            <div className="relative flex items-center gap-2.5">
              <div className="relative shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-orange-600 to-orange-800 text-white text-xs font-bold shadow-md ring-1 ring-orange-700/20">
                  RY
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold tracking-tight text-foreground">
                  Risky Yanto
                </p>
                <p className="truncate text-[10px] font-medium uppercase tracking-wider text-orange-700 dark:text-orange-400">
                  Web Developer
                </p>
              </div>
            </div>
            <div className="relative mt-2 flex items-center justify-between gap-1 border-t border-orange-500/10 pt-2 text-[10px] text-muted-foreground">
              <span className="font-medium uppercase tracking-wider">
                Developer
              </span>
              <span className="font-mono">© {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
