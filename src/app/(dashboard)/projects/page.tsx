import Link from "next/link";
import {
  CalendarDays,
  Filter,
  FolderKanban,
  Plus,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import {
  PriorityBadge,
  ProjectStatusBadge,
} from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  formatDate,
  isOverdue,
  projectCategoryLabel,
} from "@/lib/utils";
import type { Project } from "@/types";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  status?: string;
  priority?: string;
  category?: string;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("projects").select("*").order("updated_at", {
    ascending: false,
  });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.priority && params.priority !== "all") {
    query = query.eq("priority", params.priority);
  }
  if (params.category && params.category !== "all") {
    query = query.eq("category", params.category);
  }
  if (params.q) {
    query = query.or(
      `name.ilike.%${params.q}%,description.ilike.%${params.q}%`,
    );
  }

  const { data } = await query;
  const projects = (data ?? []) as Project[];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            {projects.length} {projects.length === 1 ? "project" : "projects"}{" "}
            in your workspace
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex h-9 items-center gap-2 self-start rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                name="q"
                defaultValue={params.q}
                placeholder="Search by name or description..."
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <select
              name="status"
              defaultValue={params.status ?? "all"}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="ongoing">Ongoing</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              name="priority"
              defaultValue={params.priority ?? "all"}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <select
              name="category"
              defaultValue={params.category ?? "all"}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
            >
              <option value="all">All Category</option>
              <option value="website">Website</option>
              <option value="application">Application</option>
              <option value="maintenance">Maintenance</option>
              <option value="support">Support</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="database">Database</option>
              <option value="other">Other</option>
            </select>
            <div className="flex gap-2 lg:col-span-5">
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Filter className="h-3.5 w-3.5" />
                Apply
              </button>
              <Link
                href="/projects"
                className="inline-flex h-9 items-center rounded-md border border-border px-4 text-xs font-medium hover:bg-accent"
              >
                Reset
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description={
            params.q || params.status || params.priority || params.category
              ? "Try adjusting your filters or create a new project."
              : "Create your first project to start tracking tasks."
          }
          action={
            <Link
              href="/projects/new"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const overdue = isOverdue(p.deadline, p.status);
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="group block rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <ProjectStatusBadge status={p.status} />
                  <PriorityBadge priority={p.priority} />
                </div>

                <h3 className="mt-3 truncate text-base font-semibold group-hover:text-primary">
                  {p.name}
                </h3>
                {p.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                )}

                <div className="mt-4">
                  <Progress value={p.progress} size="sm" />
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium tabular-nums">
                      {p.progress}%
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <Badge variant="outline">
                    {projectCategoryLabel[p.category]}
                  </Badge>
                  {p.deadline && (
                    <span
                      className={`inline-flex items-center gap-1 ${
                        overdue ? "text-red-600 dark:text-red-400 font-medium" : ""
                      }`}
                    >
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(p.deadline, "MMM d")}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
