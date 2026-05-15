import { CalendarDays, FolderOpen } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { PriorityBadge } from "@/components/ui/status-badge";
import {
  formatDate,
  formatDateRelative,
  isOverdue,
} from "@/lib/utils";
import type { Project, Task } from "@/types";

export const dynamic = "force-dynamic";

interface SearchParams {
  month?: string;
  year?: string;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const month = params.month ? parseInt(params.month) : now.getMonth();

  const supabase = await createClient();
  const [{ data: tasks }, { data: projects }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .not("deadline", "is", null)
      .order("deadline", { ascending: true }),
    supabase
      .from("projects")
      .select("*")
      .not("deadline", "is", null)
      .order("deadline", { ascending: true }),
  ]);

  const allTasks = (tasks ?? []) as Task[];
  const allProjects = (projects ?? []) as Project[];

  const overdueTasks = allTasks.filter((t) =>
    isOverdue(t.deadline, t.status),
  );

  const upcoming = [
    ...allTasks
      .filter(
        (t) =>
          t.status !== "done" &&
          t.deadline &&
          !isOverdue(t.deadline, t.status),
      )
      .map((t) => ({
        kind: "task" as const,
        id: t.id,
        title: t.title,
        deadline: t.deadline!,
        project_id: t.project_id,
        priority: t.priority,
        status: t.status,
      })),
  ]
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 8);

  const events = [
    ...allTasks.map((t) => ({
      id: t.id,
      title: t.title,
      date: t.deadline!,
      type: "task" as const,
      priority: t.priority,
      overdue: isOverdue(t.deadline, t.status),
      done: t.status === "done",
      projectId: t.project_id,
    })),
    ...allProjects.map((p) => ({
      id: p.id,
      title: p.name,
      date: p.deadline!,
      type: "project" as const,
      priority: p.priority,
      overdue: isOverdue(p.deadline, p.status),
      done: p.status === "completed",
      projectId: p.id,
    })),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Kalender</h1>
        <p className="text-sm text-muted-foreground">
          Lihat tenggat dan tonggak penting di semua proyek
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Belum ada tenggat"
          description="Tambahkan tenggat ke proyek atau tugas untuk melihatnya di kalender."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CalendarGrid year={year} month={month} events={events} />
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Terlambat</CardTitle>
                <CardDescription>
                  {overdueTasks.length} tugas lewat tenggat
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {overdueTasks.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Tidak ada yang terlambat
                  </p>
                ) : (
                  overdueTasks.slice(0, 5).map((t) => (
                    <Link
                      key={t.id}
                      href={`/projects/${t.project_id}`}
                      className="block rounded-md border border-red-200 bg-red-50 p-2.5 text-xs hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:hover:bg-red-900"
                    >
                      <p className="font-medium text-red-700 dark:text-red-300">
                        {t.title}
                      </p>
                      <p className="text-[11px] text-red-600/80 dark:text-red-400/80">
                        Tenggat {formatDate(t.deadline, "d MMM")} ·{" "}
                        {formatDateRelative(t.deadline)}
                      </p>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Akan Datang</CardTitle>
                <CardDescription>Tenggat berikutnya</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcoming.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Tidak ada tenggat mendatang
                  </p>
                ) : (
                  upcoming.map((u) => (
                    <Link
                      key={u.id}
                      href={`/projects/${u.project_id}`}
                      className="block rounded-md border border-border bg-card p-2.5 hover:bg-accent/40"
                    >
                      <p className="text-xs font-medium">{u.title}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(u.deadline, "d MMM")} ·{" "}
                          {formatDateRelative(u.deadline)}
                        </p>
                        <PriorityBadge priority={u.priority} />
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  Tenggat Proyek
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {allProjects.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Belum ada tenggat proyek
                  </p>
                ) : (
                  allProjects.slice(0, 6).map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="block rounded-md border border-border bg-card p-2.5 hover:bg-accent/40"
                    >
                      <p className="truncate text-xs font-medium">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Tenggat {formatDate(p.deadline, "d MMM yyyy")}
                      </p>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
