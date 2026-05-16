import { Code2, Github } from "lucide-react";

export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-card/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        {/* Left: developer credit */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-orange-600 to-orange-800 text-white text-sm font-bold shadow-sm ring-1 ring-orange-700/20">
            RY
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold leading-tight tracking-tight">
                Risky Yanto
              </p>
              <span className="inline-flex items-center gap-1 rounded border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                <Code2 className="h-2.5 w-2.5" />
                Developer
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Designed &amp; engineered by Risky Yanto
            </p>
          </div>
        </div>

        {/* Right: meta + links */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="font-mono">© {year} Risky Yanto</span>
          <span aria-hidden="true" className="text-border">|</span>
          <span>All rights reserved</span>
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
