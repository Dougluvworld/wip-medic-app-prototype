import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/ScreenHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { hasOnboarded } from "@/lib/profile-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Medi-Care — Assess. Navigate. Care." },
      { name: "description", content: "AI-powered healthcare navigation. Understand your symptoms and find the right care nearby, in minutes." },
      { property: "og:title", content: "Medi-Care — Assess. Navigate. Care." },
      { property: "og:description", content: "AI-powered healthcare navigation. Understand your symptoms and find the right care nearby, in minutes." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Splash,
});

function Splash() {
  const nav = useNavigate();
  // Redirect returning users after first paint — but render the splash markup
  // immediately so first-time users don't see a blank frame.
  const [redirecting, setRedirecting] = useState(false);
  useEffect(() => {
    if (hasOnboarded()) {
      setRedirecting(true);
      nav({ to: "/home", replace: true });
    }
  }, [nav]);

  return (
    <div className="min-h-dvh w-full bg-gradient-to-br from-[oklch(0.96_0.02_180)] via-background to-[oklch(0.94_0.04_170)] md:py-10">
      <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-background md:min-h-[900px] md:max-h-[900px] md:rounded-[44px] md:border md:border-border md:shadow-float">
        <div
          className={`relative flex flex-1 flex-col overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-opacity duration-200 ${redirecting ? "opacity-0" : "opacity-100"}`}
          aria-hidden={redirecting ? "true" : undefined}
        >
          <ThemeToggle />
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[oklch(0.75_0.14_170)] opacity-40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-[oklch(0.65_0.11_190)] opacity-30 blur-3xl" />

          <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-3xl bg-primary/20 blur-2xl" />
              <div className="animate-pulse-ring rounded-3xl">
                <Logo size={88} />
              </div>
            </div>
            <h1 className="mt-8 font-display text-5xl font-semibold tracking-tight">
              Medi-Care
            </h1>
            <p className="mt-3 text-base font-medium tracking-wide text-primary">
              Assess. Navigate. Care.
            </p>
            <p className="mt-4 max-w-[300px] text-sm leading-relaxed text-muted-foreground">
              AI-powered symptom guidance and care navigation, personalised for you.
            </p>

            <div className="mt-8 grid w-full max-w-xs grid-cols-2 gap-3 text-left">
              <div className="rounded-2xl border border-border/60 bg-card/60 p-3 backdrop-blur">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="mt-2 text-xs font-medium">Clinically-informed AI</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/60 p-3 backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <p className="mt-2 text-xs font-medium">Private & secure</p>
              </div>
            </div>
          </div>

          <div className="relative space-y-3 px-6 pb-10">
            <Link
              to="/onboarding"
              className="flex h-14 w-full items-center justify-center rounded-2xl gradient-primary text-base font-semibold text-primary-foreground shadow-soft transition-transform active:scale-[0.98]"
            >
              Get started
            </Link>
            <Link
              to="/home"
              className="flex h-11 w-full items-center justify-center text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Continue as guest →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
