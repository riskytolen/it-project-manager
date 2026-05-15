import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isPast, isToday, isTomorrow, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type {
  NoteCategory,
  Priority,
  ProjectCategory,
  ProjectStatus,
  TaskStatus,
} from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined, fmt = "d MMM yyyy") {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt, { locale: idLocale });
}

export function formatDateRelative(date: string | Date | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isToday(d)) return "Hari ini";
  if (isTomorrow(d)) return "Besok";
  return formatDistanceToNow(d, { addSuffix: true, locale: idLocale });
}

export function isOverdue(date: string | null | undefined, status?: string) {
  if (!date) return false;
  if (status === "done" || status === "completed" || status === "cancelled") return false;
  const d = parseISO(date);
  return isPast(d) && !isToday(d);
}

export function daysUntil(date: string | null | undefined) {
  if (!date) return null;
  const d = parseISO(date);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

// ============= LABELS =============
export const projectCategoryLabel: Record<ProjectCategory, string> = {
  website: "Website",
  application: "Aplikasi",
  maintenance: "Pemeliharaan",
  support: "Dukungan",
  infrastructure: "Infrastruktur",
  database: "Basis Data",
  other: "Lainnya",
};

export const projectStatusLabel: Record<ProjectStatus, string> = {
  planning: "Perencanaan",
  ongoing: "Berjalan",
  pending: "Tertunda",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const taskStatusLabel: Record<TaskStatus, string> = {
  todo: "Belum Dikerjakan",
  in_progress: "Dikerjakan",
  testing: "Pengujian",
  revision: "Revisi",
  done: "Selesai",
};

export const priorityLabel: Record<Priority, string> = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
  urgent: "Mendesak",
};

export const noteCategoryLabel: Record<NoteCategory, string> = {
  bug: "Bug",
  feature_idea: "Ide Fitur",
  documentation: "Dokumentasi",
  maintenance: "Pemeliharaan",
  reminder: "Pengingat",
  general: "Umum",
};

// ============= COLORS =============
export const projectStatusColor: Record<ProjectStatus, string> = {
  planning: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  ongoing: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-900",
};

export const taskStatusColor: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900",
  testing: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-900",
  revision: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
};

export const priorityColor: Record<Priority, string> = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-900",
  urgent: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-900",
};

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function truncate(str: string, n = 80) {
  return str.length > n ? `${str.slice(0, n)}…` : str;
}
