import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function ScreenHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title?: string;
  subtitle?: string;
  back?: string | true;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/85 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+14px)] backdrop-blur-xl">
      {back ? (
        typeof back === "string" ? (
          <Link
            to={back}
            className="grid h-10 w-10 place-items-center rounded-full bg-muted text-foreground hover:bg-accent"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ) : (
          <button
            onClick={() => history.back()}
            className="grid h-10 w-10 place-items-center rounded-full bg-muted text-foreground hover:bg-accent"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )
      ) : null}
      <div className="min-w-0 flex-1">
        {title ? (
          <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
        ) : null}
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {right}
    </header>
  );
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-soft"
      style={{ height: size, width: size }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-1/2 w-1/2" aria-hidden>
        <path
          d="M12 21s-7-4.35-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.65-7 10-7 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M9 12h2v-2h2v2h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
