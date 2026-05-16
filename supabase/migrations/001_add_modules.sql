-- ============================================
-- Migration 001: Add Modules layer
-- ============================================
-- Adds an optional "module" between projects and tasks.
-- A project can have many modules. A task can optionally
-- belong to a module. Tasks without a module remain valid.
--
-- Run this in the Supabase SQL Editor AFTER schema.sql.
-- ============================================

-- ============================================
-- TABLE: modules
-- ============================================
create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  description text,
  status project_status not null default 'planning',
  priority priority_level not null default 'medium',
  progress int not null default 0 check (progress between 0 and 100),
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- ALTER: tasks gets optional module_id
-- ============================================
alter table tasks
  add column if not exists module_id uuid references modules(id) on delete set null;

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_modules_project_id on modules(project_id);
create index if not exists idx_modules_status on modules(status);
create index if not exists idx_tasks_module_id on tasks(module_id);

-- ============================================
-- TRIGGERS
-- ============================================
drop trigger if exists trg_modules_updated on modules;
create trigger trg_modules_updated before update on modules
  for each row execute function set_updated_at();

-- Recalc module progress when tasks change.
-- Also keeps project progress recalculation working
-- because module_id changes don't affect project progress logic.
create or replace function recalc_module_progress()
returns trigger as $$
declare
  mid uuid;
  total int;
  done_count int;
  new_progress int;
begin
  mid := coalesce(new.module_id, old.module_id);
  if mid is null then return coalesce(new, old); end if;

  select count(*) into total from tasks where module_id = mid;
  select count(*) into done_count from tasks where module_id = mid and status = 'done';

  if total = 0 then
    new_progress := 0;
  else
    new_progress := round((done_count::numeric / total::numeric) * 100);
  end if;

  update modules set progress = new_progress where id = mid;
  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists trg_tasks_recalc_module on tasks;
create trigger trg_tasks_recalc_module after insert or update or delete on tasks
  for each row execute function recalc_module_progress();

-- ============================================
-- RLS
-- ============================================
alter table modules enable row level security;
drop policy if exists modules_all on modules;
create policy modules_all on modules for all using (true) with check (true);
