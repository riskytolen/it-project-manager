import { Database, ExternalLink, Settings as SettingsIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/settings-form";
import type { AppSettings } from "@/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  const [
    { count: projectCount },
    { count: taskCount },
    { count: noteCount },
    { count: fileCount },
  ] = await Promise.all([
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("tasks").select("*", { count: "exact", head: true }),
    supabase.from("notes").select("*", { count: "exact", head: true }),
    supabase.from("files").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Personalisasi ruang kerja kamu
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            Preferensi
          </CardTitle>
          <CardDescription>Nama tampilan dan target pribadi</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm settings={(data ?? null) as AppSettings | null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Statistik Ruang Kerja
          </CardTitle>
          <CardDescription>Ringkasan singkat data ruang kerja kamu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Proyek" value={projectCount ?? 0} />
            <Stat label="Tugas" value={taskCount ?? 0} />
            <Stat label="Catatan" value={noteCount ?? 0} />
            <Stat label="Berkas" value={fileCount ?? 0} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tentang</CardTitle>
          <CardDescription>Informasi aplikasi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Versi" value="1.0.0" />
          <Row label="Stack" value="Next.js · TypeScript · Tailwind · Supabase" />
          <Row
            label="Pengembang"
            value={
              <span className="font-semibold text-foreground">Risky Yanto</span>
            }
          />
          <Row
            label="Penyimpanan"
            value={
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Dasbor Supabase
                <ExternalLink className="h-3 w-3" />
              </a>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
