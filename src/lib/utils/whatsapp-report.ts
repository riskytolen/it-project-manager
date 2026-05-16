import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  projectStatusLabel,
} from "@/lib/utils";
import type {
  Project,
  ProjectStatus,
  Task,
} from "@/types";

const STATUS_EMOJI: Record<ProjectStatus, string> = {
  planning: "🧭",
  ongoing: "🟢",
  pending: "🟡",
  completed: "✅",
  cancelled: "⛔",
};

function divider() {
  return "━━━━━━━━━━━━━━━━━━";
}

function timestamp() {
  return format(new Date(), "d MMM yyyy, HH:mm", { locale: idLocale });
}

// ============================================================
// Project report (single project) — short notice + link
// ============================================================
export function buildProjectWhatsAppReport({
  project,
  boardUrl,
}: {
  project: Project;
  /** unused — kept for backward compatibility */
  tasks?: Task[];
  /** unused — kept for backward compatibility */
  activities?: unknown[];
  boardUrl?: string;
}) {
  const lines: string[] = [];

  lines.push(`📋 *Update Proyek*`);
  lines.push(divider());
  lines.push("");
  lines.push(`Halo, berikut info singkat untuk proyek:`);
  lines.push(`*${project.name}*`);
  lines.push(
    `Status saat ini: ${STATUS_EMOJI[project.status]} ${projectStatusLabel[project.status]}`,
  );
  lines.push("");
  lines.push(
    "Untuk melihat progres dan detail tugas terbaru, silakan kunjungi tautan berikut:",
  );
  if (boardUrl) {
    lines.push(`👉 ${boardUrl}`);
  }
  lines.push("");
  lines.push(divider());
  lines.push(`_Diperbarui ${timestamp()}_`);

  return lines.join("\n");
}

// ============================================================
// Workspace-wide report — short notice + link
// ============================================================
export function buildWorkspaceWhatsAppReport({
  displayName,
  boardUrl,
}: {
  /** unused — kept for backward compatibility */
  projects?: Project[];
  /** unused — kept for backward compatibility */
  tasks?: Task[];
  displayName?: string;
  boardUrl?: string;
}) {
  const lines: string[] = [];

  lines.push(`📋 *Update Ruang Kerja${displayName ? ` — ${displayName}` : ""}*`);
  lines.push(divider());
  lines.push("");
  lines.push("Halo, berikut info singkat:");
  lines.push(
    "Progres seluruh proyek dan tugas IT dapat dilihat secara langsung pada papan tugas berikut.",
  );
  lines.push("");
  if (boardUrl) {
    lines.push("Silakan buka tautan ini untuk melihat detail terbaru:");
    lines.push(`👉 ${boardUrl}`);
  }
  lines.push("");
  lines.push(divider());
  lines.push(`_Diperbarui ${timestamp()}_`);

  return lines.join("\n");
}
