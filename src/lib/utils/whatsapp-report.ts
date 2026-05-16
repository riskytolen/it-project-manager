import { format, formatDistanceStrict, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  isOverdue,
  priorityLabel,
  projectStatusLabel,
  taskStatusLabel,
} from "@/lib/utils";
import type {
  ActivityLog,
  Priority,
  Project,
  ProjectStatus,
  Task,
  TaskStatus,
} from "@/types";

const PRIORITY_EMOJI: Record<Priority, string> = {
  low: "⚪",
  medium: "🟡",
  high: "🟠",
  urgent: "🔴",
};

const STATUS_EMOJI: Record<ProjectStatus, string> = {
  planning: "🧭",
  ongoing: "🟢",
  pending: "🟡",
  completed: "✅",
  cancelled: "⛔",
};

const TASK_STATUS_EMOJI: Record<TaskStatus, string> = {
  todo: "📝",
  in_progress: "🔄",
  testing: "🧪",
  revision: "♻️",
  done: "✅",
};

function progressBar(percent: number, width = 10) {
  const safe = Math.max(0, Math.min(100, percent));
  const filled = Math.round((safe / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function formatTenggat(date: string | null | undefined) {
  if (!date) return "—";
  const d = parseISO(date);
  const formatted = format(d, "d MMM yyyy", { locale: idLocale });
  const now = new Date();
  const past = d.getTime() < now.getTime();
  const distance = formatDistanceStrict(d, now, { locale: idLocale });
  return past
    ? `${formatted} (terlambat ${distance})`
    : `${formatted} (${distance} lagi)`;
}

function header(title: string) {
  return `📊 *${title.toUpperCase()}*`;
}

function divider() {
  return "━━━━━━━━━━━━━━━━━━";
}

function timestamp() {
  return format(new Date(), "d MMM yyyy, HH:mm", { locale: idLocale });
}

// ============================================================
// Project report
// ============================================================
export function buildProjectWhatsAppReport({
  project,
  tasks,
  activities,
}: {
  project: Project;
  tasks: Task[];
  activities?: ActivityLog[];
}) {
  const stats: Record<TaskStatus, number> = {
    todo: 0,
    in_progress: 0,
    testing: 0,
    revision: 0,
    done: 0,
  };
  for (const t of tasks) stats[t.status]++;

  const overdueTasks = tasks.filter((t) => isOverdue(t.deadline, t.status));
  const upcoming = tasks
    .filter(
      (t) =>
        t.deadline &&
        t.status !== "done" &&
        !isOverdue(t.deadline, t.status),
    )
    .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""))
    .slice(0, 5);

  const lines: string[] = [];

  lines.push(header(`Laporan Proyek: ${project.name}`));
  lines.push(divider());
  lines.push(
    `Status: ${STATUS_EMOJI[project.status]} ${projectStatusLabel[project.status]}  •  Prioritas: ${PRIORITY_EMOJI[project.priority]} ${priorityLabel[project.priority]}`,
  );
  lines.push(`Progres: ${progressBar(project.progress)} *${project.progress}%*`);
  lines.push(`Tenggat: ${formatTenggat(project.deadline)}`);
  if (project.description) {
    lines.push("");
    lines.push(`_${project.description.replace(/\s+/g, " ").trim()}_`);
  }

  // Task stats
  lines.push("");
  lines.push("*📋 Ringkasan Tugas*");
  lines.push(`Total: *${tasks.length}*`);
  (
    [
      "done",
      "in_progress",
      "testing",
      "revision",
      "todo",
    ] as TaskStatus[]
  ).forEach((s) => {
    if (stats[s] > 0) {
      lines.push(`${TASK_STATUS_EMOJI[s]} ${taskStatusLabel[s]}: ${stats[s]}`);
    }
  });

  // Overdue
  if (overdueTasks.length > 0) {
    lines.push("");
    lines.push(`*⚠️ Terlambat (${overdueTasks.length})*`);
    overdueTasks.slice(0, 5).forEach((t) => {
      lines.push(`• ${t.title} — ${formatTenggat(t.deadline)}`);
    });
    if (overdueTasks.length > 5) {
      lines.push(`…dan ${overdueTasks.length - 5} lainnya`);
    }
  }

  // Upcoming
  if (upcoming.length > 0) {
    lines.push("");
    lines.push("*📅 Tenggat Berikutnya*");
    upcoming.forEach((t) => {
      lines.push(
        `• ${t.title} — ${format(parseISO(t.deadline!), "d MMM", { locale: idLocale })} (${PRIORITY_EMOJI[t.priority]} ${priorityLabel[t.priority]})`,
      );
    });
  }

  // Recent activity (optional)
  if (activities && activities.length > 0) {
    lines.push("");
    lines.push("*🕒 Aktivitas Terbaru*");
    activities.slice(0, 3).forEach((a) => {
      lines.push(`• ${a.description}`);
    });
  }

  lines.push("");
  lines.push(divider());
  lines.push(`_Diperbarui ${timestamp()}_`);

  return lines.join("\n");
}

// ============================================================
// Workspace-wide report (dashboard)
// ============================================================
export function buildWorkspaceWhatsAppReport({
  projects,
  tasks,
  displayName,
}: {
  projects: Project[];
  tasks: Task[];
  displayName?: string;
}) {
  const activeProjects = projects.filter(
    (p) =>
      p.status === "ongoing" ||
      p.status === "planning" ||
      p.status === "pending",
  );
  const completedProjects = projects.filter((p) => p.status === "completed");
  const overdueTasks = tasks.filter((t) => isOverdue(t.deadline, t.status));
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const avgProgress =
    projects.length === 0
      ? 0
      : Math.round(
          projects.reduce((s, p) => s + p.progress, 0) / projects.length,
        );

  const upcoming = tasks
    .filter(
      (t) =>
        t.deadline &&
        t.status !== "done" &&
        !isOverdue(t.deadline, t.status),
    )
    .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""))
    .slice(0, 5);

  const lines: string[] = [];

  lines.push(header(`Laporan Ruang Kerja${displayName ? ` — ${displayName}` : ""}`));
  lines.push(divider());

  lines.push(`📦 Proyek aktif: *${activeProjects.length}* dari ${projects.length}`);
  lines.push(`✅ Proyek selesai: *${completedProjects.length}*`);
  lines.push(`📊 Rata-rata progres: ${progressBar(avgProgress)} *${avgProgress}%*`);
  lines.push("");
  lines.push(`🔄 Tugas dikerjakan: *${inProgressTasks.length}*`);
  lines.push(`✅ Tugas selesai: *${doneTasks.length}*`);
  lines.push(`⚠️ Tugas terlambat: *${overdueTasks.length}*`);

  // Active projects breakdown
  if (activeProjects.length > 0) {
    lines.push("");
    lines.push("*📌 Proyek Aktif*");
    activeProjects.slice(0, 5).forEach((p) => {
      lines.push(
        `${STATUS_EMOJI[p.status]} ${p.name} — *${p.progress}%* ${progressBar(p.progress, 6)}`,
      );
    });
    if (activeProjects.length > 5) {
      lines.push(`…dan ${activeProjects.length - 5} proyek lainnya`);
    }
  }

  // Overdue
  if (overdueTasks.length > 0) {
    lines.push("");
    lines.push(`*⚠️ Tugas Terlambat (${overdueTasks.length})*`);
    overdueTasks.slice(0, 5).forEach((t) => {
      lines.push(`• ${t.title} — ${formatTenggat(t.deadline)}`);
    });
    if (overdueTasks.length > 5) {
      lines.push(`…dan ${overdueTasks.length - 5} lainnya`);
    }
  }

  // Upcoming deadlines
  if (upcoming.length > 0) {
    lines.push("");
    lines.push("*📅 Tenggat Terdekat*");
    upcoming.forEach((t) => {
      lines.push(
        `• ${t.title} — ${format(parseISO(t.deadline!), "d MMM", { locale: idLocale })}`,
      );
    });
  }

  lines.push("");
  lines.push(divider());
  lines.push(`_Diperbarui ${timestamp()}_`);

  return lines.join("\n");
}
