import { Code2, Github, Heart } from "lucide-react";

export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-gradient-to-br from-card via-background to-orange-500/5">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        {/* Left: developer credit */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-700 text-white text-sm font-bold shadow-md ring-2 ring-background">
              RY
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold leading-tight">Risky Yanto</p>
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                <Code2 className="h-2.5 w-2.5" />
                Developer
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Web Developer & Designer
            </p>
          </div>
        </div>

        {/* Center: love line */}
        <p className="hidden items-center gap-1.5 text-xs text-muted-foreground md:inline-flex">
          <span>Dibuat dengan</span>
          <Heart
            className="h-3.5 w-3.5 fill-red-500 text-red-500 animate-pulse"
            aria-label="cinta"
          />
          <span>di Indonesia</span>
        </p>

        {/* Right: meta + links */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="font-mono">© {year}</span>
            <span>Risky Yanto</span>
          </span>
          <span aria-hidden="true" className="text-border">|</span>
          <span>v1.0.0</span>
          <span aria-hidden="true" className="text-border">|</span>
          <a
            href="https://github.com/riskytolen/it-project-manager"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground"
          >
            <Github className="h-3 w-3" />
            Source
          </a>
        </div>
      </div>
    </footer>
  );
}
