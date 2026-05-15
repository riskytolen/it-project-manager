export type ProjectCategory =
  | "website"
  | "application"
  | "maintenance"
  | "support"
  | "infrastructure"
  | "database"
  | "other";

export type ProjectStatus =
  | "planning"
  | "ongoing"
  | "pending"
  | "completed"
  | "cancelled";

export type Priority = "low" | "medium" | "high" | "urgent";

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "testing"
  | "revision"
  | "done";

export type NoteCategory =
  | "bug"
  | "feature_idea"
  | "documentation"
  | "maintenance"
  | "reminder"
  | "general";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  category: ProjectCategory;
  status: ProjectStatus;
  priority: Priority;
  progress: number;
  deadline: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  progress: number;
  deadline: string | null;
  notes: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface TaskChecklist {
  id: string;
  task_id: string;
  content: string;
  is_done: boolean;
  position: number;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string | null;
  category: NoteCategory;
  is_pinned: boolean;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileRecord {
  id: string;
  name: string;
  path: string;
  size: number;
  mime_type: string | null;
  project_id: string | null;
  task_id: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AppSettings {
  id: number;
  display_name: string;
  theme: "light" | "dark" | "system";
  accent_color: string;
  weekly_goal: number;
  updated_at: string;
}

export type TaskWithProject = Task & {
  project: Pick<Project, "id" | "name"> | null;
};

export type ProjectWithStats = Project & {
  task_count: number;
  done_count: number;
};
