import { Github } from "lucide-react";

export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1 px-4 py-3 text-[11px] text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
        <p>
          © {year}{" "}
          <span className="font-medium text-foreground/80">Risky Yanto</span>
          <span className="mx-1.5 text-border">·</span>
          <span>v1.0.0</span>
        </p>
        <a
          href="https://github.com/riskytolen/it-project-manager"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
        >
          <Github className="h-3 w-3" />
          Source
        </a>
      </div>
    </footer>
  );
}
