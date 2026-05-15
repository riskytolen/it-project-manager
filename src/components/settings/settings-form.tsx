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
      else toast.success("Settings saved");
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="display_name">Display Name</Label>
          <Input
            id="display_name"
            name="display_name"
            defaultValue={settings?.display_name ?? "IT Manager"}
            placeholder="Your name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="weekly_goal">Weekly Task Goal</Label>
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
          <Label htmlFor="accent_color">Accent Theme</Label>
          <Select
            id="accent_color"
            name="accent_color"
            defaultValue={settings?.accent_color ?? "blue"}
          >
            <option value="blue">Blue (default)</option>
            <option value="indigo">Indigo</option>
            <option value="emerald">Emerald</option>
            <option value="amber">Amber</option>
            <option value="rose">Rose</option>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Note: Use the topbar toggle to switch light/dark mode.
          </p>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <Button type="submit" loading={isPending}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </form>
  );
}
