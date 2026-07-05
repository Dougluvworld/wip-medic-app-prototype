import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/ScreenHeader";
import { recentAssessments } from "@/lib/mock-data";
import { Settings, AlertTriangle, Stethoscope, ChevronRight, UserCircle2, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [{ title: "Home — Medi-Care" }, { name: "robots", content: "noindex" }],
  }),
  component: Home,
});

const urgencyColor = {
  Low: "bg-success/15 text-success",
  Medium: "bg-warning/20 text-warning-foreground",
  High: "bg-destructive/15 text-destructive",
} as const;

function Home() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+18px)]">
          <div className="flex items-center gap-3">
            <Logo size={44} />
            <div>
              <p className="text-xs font-medium text-muted-foreground">{greeting},</p>
              <p className="text-base font-semibold">Alex</p>
            </div>
          </div>
          <Link to="/settings" className="grid h-10 w-10 place-items-center rounded-full bg-muted text-foreground hover:bg-accent">
            <Settings className="h-5 w-5" />
          </Link>
        </header>

        <div className="flex-1 space-y-5 px-5 py-6">
          {/* Emergency banner */}
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 animate-fade-in">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-destructive/15 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-destructive">Life-threatening emergency?</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Call 999 immediately for chest pain, severe bleeding, or breathing difficulty.
              </p>
            </div>
            <a
              href="tel:999"
              className="shrink-0 rounded-full bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground shadow-soft"
            >
              Call 999
            </a>
          </div>

          {/* Quick assessment CTA */}
          <Link
            to="/assess"
            className="relative block overflow-hidden rounded-3xl gradient-primary p-6 text-primary-foreground shadow-float transition-transform active:scale-[0.99] animate-fade-in-up"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center justify-between">
              <div className="max-w-[70%]">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/80">
                  Not feeling well?
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold leading-tight">
                  Start a quick assessment
                </h2>
                <p className="mt-2 text-sm text-primary-foreground/85">
                  60 seconds. Guided by AI.
                </p>
              </div>
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
                <Stethoscope className="h-7 w-7" strokeWidth={2} />
              </div>
            </div>
          </Link>

          {/* Shortcuts */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/profile"
              className="group rounded-2xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary">
                <UserCircle2 className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold">Medical profile</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Allergies, conditions</p>
            </Link>
            <Link
              to="/care"
              className="group rounded-2xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary">
                <ClipboardList className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold">Find care</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Pharmacies, GPs, A&E</p>
            </Link>
          </div>

          {/* Recent assessments */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Recent assessments</h3>
              <button className="text-xs font-medium text-primary">See all</button>
            </div>
            <div className="space-y-2">
              {recentAssessments.map((a) => (
                <Link
                  key={a.id}
                  to="/results"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{a.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.date} · {a.action}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${urgencyColor[a.urgency]}`}>
                    {a.urgency}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>

          {/* Health tip */}
          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-accent to-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Daily tip</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">
              Aim for 7–9 hours of sleep. Poor sleep weakens your immune response and increases stress.
            </p>
          </div>
        </div>

        <BottomNav />
      </div>
    </PhoneFrame>
  );
}
