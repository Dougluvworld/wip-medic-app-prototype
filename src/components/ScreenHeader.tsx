import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function ScreenHeader({
  title,
  subtitle,
  back,
  backFallback,
  right,
}: {
  title?: string;
  subtitle?: string;
  /**
   * - a path string: navigate there
   * - `true` or `"auto"`: use browser back with `backFallback` (default "/home")
   * - omit: no back button
   */
  back?: string | true | "auto";
  backFallback?: string;
  right?: ReactNode;
}) {
  const router = useRouter();

  const backNode =
    back === undefined ? null : back === true || back === "auto" ? (
      <AutoBackButton fallback={backFallback ?? "/home"} router={router} />
    ) : (
      <Link
        to={back}
        className="grid h-10 w-10 place-items-center rounded-full bg-muted text-foreground hover:bg-accent"
        aria-label="Back"
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>
    );

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/85 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+14px)] backdrop-blur-xl">
      {backNode}
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

function AutoBackButton({ fallback, router }: { fallback: string; router: ReturnType<typeof useRouter> }) {
  const goBack = () => {
    // Only go back if there's meaningful history within this session
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      router.navigate({ to: fallback });
    }
  };
  return (
    <button
      onClick={goBack}
      className="grid h-10 w-10 place-items-center rounded-full bg-muted text-foreground hover:bg-accent"
      aria-label="Back"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
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
