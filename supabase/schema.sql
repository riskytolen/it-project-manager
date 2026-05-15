-- ============================================
-- IT Project Manager - Supabase Schema
-- ============================================
-- Run this in the Supabase SQL Editor.
-- This is a single-user personal app, RLS is enabled
-- but policies allow all access for the anon key.
-- For multi-user, replace the policies with auth.uid() based ones.

-- Extensions
create extension if not exists "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================
do $$ begin
  create type project_category as enum ('website','application','maintenance','support','infrastructure','database','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_status as enum ('planning','ongoing','pending','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type priority_level as enum ('low','medium','high','urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('todo','in_progress','testing','revision','done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type note_category as enum ('bug','feature_idea','documentation','maintenance','reminder','general');
exception when duplicate_object then null; end $$;

-- ============================================
-- TABLES
-- ============================================

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category project_category not null default 'other',
  status project_status not null default 'planning',
  priority priority_level not null default 'medium',
  progress int not null default 0 check (progress between 0 and 100),
  deadline date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  status task_status not null default 'todo',
  priority priority_level not null default 'medium',
  progress int not null default 0 check (progress between 0 and 100),
  deadline date,
  notes text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists task_checklists (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  content text not null,
  is_done boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  category note_category not null default 'general',
  is_pinned boolean not null default false,
  project_id uuid references projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  path text not null,
  size bigint not null default 0,
  mime_type text,
  project_id uuid references projects(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  description text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  id int primary key default 1,
  display_name text default 'IT Manager',
  theme text default 'system',
  accent_color text default 'blue',
  weekly_goal int default 10,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into settings (id) values (1) on conflict (id) do nothing;

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_tasks_project_id on tasks(project_id);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_tasks_deadline on tasks(deadline);
create index if not exists idx_projects_status on projects(status);
create index if not exists idx_projects_deadline on projects(deadline);
create index if not exists idx_checklists_task_id on task_checklists(task_id);
create index if not exists idx_notes_category on notes(category);
create index if not exists idx_files_project_id on files(project_id);
create index if not exists idx_files_task_id on files(task_id);
create index if not exists idx_activity_created on activity_logs(created_at desc);

-- ============================================
-- TRIGGERS
-- ============================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_projects_updated on projects;
create trigger trg_projects_updated before update on projects
  for each row execute function set_updated_at();

drop trigger if exists trg_tasks_updated on tasks;
create trigger trg_tasks_updated before update on tasks
  for each row execute function set_updated_at();

drop trigger if exists trg_notes_updated on notes;
create trigger trg_notes_updated before update on notes
  for each row execute function set_updated_at();

-- Auto recalc project progress when tasks change
create or replace function recalc_project_progress()
returns trigger as $$
declare
  pid uuid;
  total int;
  done_count int;
  new_progress int;
begin
  pid := coalesce(new.project_id, old.project_id);
  if pid is null then return coalesce(new, old); end if;

  select count(*) into total from tasks where project_id = pid;
  select count(*) into done_count from tasks where project_id = pid and status = 'done';

  if total = 0 then
    new_progress := 0;
  else
    new_progress := round((done_count::numeric / total::numeric) * 100);
  end if;

  update projects set progress = new_progress where id = pid;
  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists trg_tasks_recalc on tasks;
create trigger trg_tasks_recalc after insert or update or delete on tasks
  for each row execute function recalc_project_progress();

-- ============================================
-- RLS (single-user friendly)
-- ============================================
alter table projects enable row level security;
alter table tasks enable row level security;
alter table task_checklists enable row level security;
alter table notes enable row level security;
alter table files enable row level security;
alter table activity_logs enable row level security;
alter table settings enable row level security;

-- Permissive policies (single user, personal app).
-- Replace with auth.uid()-based rules if you add auth.
do $$
declare
  t text;
begin
  for t in select unnest(array['projects','tasks','task_checklists','notes','files','activity_logs','settings'])
  loop
    execute format('drop policy if exists %I_all on %I', t || '_all', t);
    execute format('create policy %I on %I for all using (true) with check (true)', t || '_all', t);
  end loop;
end $$;
