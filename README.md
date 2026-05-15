# IT Project Manager

A modern, personal IT project management workspace. Track projects, tasks, deadlines, notes, and files in one clean dashboard.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

## Features

- **Dashboard** — Stats, charts, recent activity, upcoming deadlines, progress overview
- **Projects** — Full CRUD with category, status, priority, deadline, notes
- **Tasks** — Per-project tasks with checklist, deadline, priority, notes
- **Kanban Board** — Drag & drop across Todo / In Progress / Testing / Revision / Done
- **Calendar** — Monthly view with deadline highlighting and overdue alerts
- **Notes** — Bugs, feature ideas, documentation, maintenance, reminders, general
- **File Manager** — Upload to Supabase Storage, attach to projects/tasks
- **Search & Filter** — On projects, tasks, notes
- **Dark Mode** — Light / system / dark via `next-themes`
- **Responsive** — Polished on desktop and mobile

## Stack

| Layer        | Tool                              |
| ------------ | --------------------------------- |
| Framework    | Next.js 15 App Router             |
| Language     | TypeScript                        |
| Styling      | Tailwind CSS + CSS variables      |
| Database     | Supabase (Postgres)               |
| Storage      | Supabase Storage                  |
| Auth         | None (single-user personal app)   |
| Drag & drop  | `@hello-pangea/dnd`               |
| Charts       | `recharts`                        |
| Icons        | `lucide-react`                    |
| Toasts       | `sonner`                          |
| Validation   | `zod`                             |
| Date utils   | `date-fns`                        |

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/        # Authenticated app routes
│   │   ├── dashboard/      # Main dashboard
│   │   ├── projects/       # List, new, detail, edit
│   │   ├── board/          # Kanban
│   │   ├── calendar/       # Calendar view
│   │   ├── notes/          # Notes
│   │   ├── files/          # File manager
│   │   ├── settings/       # Settings
│   │   └── layout.tsx      # App shell
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx            # Redirect to /dashboard
├── components/
│   ├── ui/                 # Reusable primitives
│   ├── layout/             # Sidebar, topbar, theme toggle
│   ├── dashboard/          # Charts, stat cards
│   ├── projects/           # Project form, attachments
│   ├── tasks/              # Task modal, list, checklist
│   ├── board/              # Kanban
│   ├── calendar/           # Calendar grid
│   ├── notes/              # Notes view
│   └── settings/           # Settings form
├── lib/
│   ├── supabase/           # client.ts (browser), server.ts (RSC/actions)
│   ├── actions/            # Server actions: projects, tasks, notes, files, settings
│   └── utils/              # Helpers (formatters, color/label maps)
└── types/                  # Shared TypeScript types

supabase/
└── schema.sql              # Full DB schema with triggers + RLS
```

## Setup

### 1. Install

```bash
cd it-project-manager
npm install
```

### 2. Create Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. In **SQL Editor**, paste & run the contents of `supabase/schema.sql`.
3. In **Storage**, create a new bucket called `project-files` (or whatever you set in `NEXT_PUBLIC_SUPABASE_BUCKET`). Mark it **Public** for the easiest setup, or keep it private (signed URLs are already used in the code).

### 3. Configure environment

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_BUCKET=project-files
```

> Get the URL and anon key from **Project Settings → API**.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected straight to the dashboard.

## Database Notes

- The schema enables **Row-Level Security** with permissive policies (it's designed as a single-user personal app using only the anon key). For multi-user, replace the policies with `auth.uid()`-based ones and wire up Supabase auth.
- A trigger automatically recalculates `projects.progress` whenever tasks are added/updated/deleted (based on the share of `done` tasks).
- `task_checklists`, `notes`, `files`, and `activity_logs` all cascade properly when their parent project/task is deleted.

## Scripts

| Command            | Purpose                |
| ------------------ | ---------------------- |
| `npm run dev`      | Local dev server       |
| `npm run build`    | Production build       |
| `npm run start`    | Run production build   |
| `npm run lint`     | Lint                   |
| `npm run type-check` | TypeScript check     |

## Customization

- **Theme colors** — edit CSS variables in `src/app/globals.css` (`:root` and `.dark`)
- **Sidebar links** — edit `src/components/layout/sidebar.tsx`
- **Categories / statuses** — edit enum types in `supabase/schema.sql` and `src/types/index.ts`, then refresh the label/color maps in `src/lib/utils/index.ts`
- **Storage bucket** — change `NEXT_PUBLIC_SUPABASE_BUCKET` and ensure the bucket exists in Supabase

## License

Personal use. Build on top freely.
