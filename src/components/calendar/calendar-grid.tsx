"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Priority } from "@/types";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "task" | "project";
  priority: Priority;
  overdue: boolean;
  done: boolean;
  projectId: string;
}

interface Props {
  year: number;
  month: number;
  events: CalendarEvent[];
}

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const TYPE_LABEL: Record<"task" | "project", string> = {
  task: "Tugas",
  project: "Proyek",
};

const PRIORITY_COLOR: Record<Priority, string> = {
  low: "bg-slate-400",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

export function CalendarGrid({ year, month, events: initialEvents }: Props) {
  const [current, setCurrent] = useState(new Date(year, month, 1));
  const [selected, setSelected] = useState<Date | null>(null);

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = useMemo(() => {
    const out: Date[] = [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      out.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }, [gridStart, gridEnd]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of initialEvents) {
      const key = e.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [initialEvents]);

  const selectedKey = selected ? format(selected, "yyyy-MM-dd") : null;
  const selectedEvents = selectedKey
    ? eventsByDate.get(selectedKey) ?? []
    : [];

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-lg font-semibold">{format(current, "MMMM yyyy", { locale: idLocale })}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrent(subMonths(current, 1))}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setCurrent(new Date());
              setSelected(null);
            }}
            className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium hover:bg-accent"
          >
            Hari ini
          </button>
          <button
            onClick={() => setCurrent(addMonths(current, 1))}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate.get(key) ?? [];
          const inMonth = isSameMonth(day, current);
          const today = isToday(day);
          const isSelected = selected && isSameDay(day, selected);

          return (
            <button
              key={key}
              onClick={() => setSelected(day)}
              className={cn(
                "relative min-h-[88px] border-b border-r border-border p-2 text-left transition-colors",
                !inMonth && "bg-muted/20 text-muted-foreground/60",
                inMonth && "hover:bg-accent/40",
                isSelected && "bg-primary/10",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    today &&
                      "bg-primary text-primary-foreground font-semibold",
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 && (
                  <span className="rounded-full bg-card px-1.5 text-[10px] tabular-nums text-muted-foreground border border-border">
                    {dayEvents.length}
                  </span>
                )}
              </div>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <div
                    key={e.id + e.type}
                    className={cn(
                      "flex items-center gap-1 truncate text-[10px]",
                      e.done && "line-through opacity-60",
                      e.overdue && "text-red-600 dark:text-red-400 font-medium",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        PRIORITY_COLOR[e.priority],
                      )}
                    />
                    <span className="truncate">{e.title}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-muted-foreground">
                    +{dayEvents.length - 3} lagi
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="border-t border-border p-4 animate-slide-down">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {format(selected, "EEEE, d MMMM yyyy", { locale: idLocale })}
            </h3>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Bersihkan
            </button>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Tidak ada agenda di hari ini.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {selectedEvents.map((e) => (
                <li key={e.id + e.type}>
                  <Link
                    href={`/projects/${e.projectId}`}
                    className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 hover:bg-accent/40"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          PRIORITY_COLOR[e.priority],
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs font-medium",
                          e.done && "line-through opacity-60",
                          e.overdue &&
                            "text-red-600 dark:text-red-400",
                        )}
                      >
                        {e.title}
                      </span>
                    </div>
                    <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {TYPE_LABEL[e.type]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
