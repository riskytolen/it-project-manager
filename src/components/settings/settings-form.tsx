"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { updateSettings } from "@/lib/actions/settings";
import type { AppSettings } from "@/types";

export function SettingsForm({ settings }: { settings: AppSettings | null }) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await updateSettings(formData);
      if (res?.error) toast.error(res.error);
      else toast.success("Pengaturan tersimpan");
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="display_name">Nama Tampilan</Label>
          <Input
            id="display_name"
            name="display_name"
            autoFormat="title"
            defaultValue={settings?.display_name ?? "IT Manager"}
            placeholder="Nama kamu"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="weekly_goal">Target Tugas Mingguan</Label>
          <Input
            id="weekly_goal"
            name="weekly_goal"
            type="number"
            min={1}
            max={100}
            defaultValue={settings?.weekly_goal ?? 10}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="accent_color">Tema Aksen</Label>
          <Select
            id="accent_color"
            name="accent_color"
            defaultValue={settings?.accent_color ?? "blue"}
          >
            <option value="blue">Biru (default)</option>
            <option value="indigo">Indigo</option>
            <option value="emerald">Hijau</option>
            <option value="amber">Kuning</option>
            <option value="rose">Merah Muda</option>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Catatan: Gunakan pengalih di topbar untuk berganti mode terang/gelap.
          </p>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <Button type="submit" loading={isPending}>
          <Save className="h-4 w-4" />
          Simpan Perubahan
        </Button>
      </div>
    </form>
  );
}
