import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/ScreenHeader";
import { TravelBanner } from "@/components/TravelBanner";
import { InstallPrompt } from "@/components/InstallPrompt";
import { getEmergencyInfo } from "@/lib/locale";
import { useTravelState } from "@/lib/travel-mode";
import { loadProfile } from "@/lib/profile-store";
import { loadHistory, formatRelative, type HistoryEntry } from "@/lib/history-store";
import { dailyTip } from "@/lib/tips";
import { AlertTriangle, Stethoscope, ChevronRight, UserCircle2, ClipboardList, Phone } from "lucide-react";
import { useEffect, useState } from "react";

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
  const travel = useTravelState();
  const emergency = getEmergencyInfo(
    travel.mode === "away" && travel.currentCountry ? travel.currentCountry : travel.homeCountry,
  );

  // Everything here is client-only to avoid SSR/timezone mismatch on the
  // greeting and to keep localStorage reads out of the render path.
  const [greeting, setGreeting] = useState<string>("Hi");
  const [name, setName] = useState<string>("there");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [tip, setTip] = useState<string>("");
  const [ecName, setEcName] = useState<string>("");
  const [ecPhone, setEcPhone] = useState<string>("");

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
    const profile = loadProfile();
    const first = (profile.name ?? "").trim().split(/\s+/)[0];
    setName(first || "there");
    setHistory(loadHistory());
    setTip(dailyTip(profile));
    setEcName((profile.emergencyContact?.name ?? "").trim());
    setEcPhone((profile.emergencyContact?.phone ?? "").trim());
  }, []);

  const hasContact = ecPhone.length > 0;
  const sosHref = hasContact ? `tel:${ecPhone}` : `tel:${emergency.number}`;
  const sosLabel = hasContact
    ? `Call ${ecName || "contact"}`
    : `SOS ${emergency.number}`;
  const sosAria = hasContact
    ? `Call emergency contact ${ecName || ecPhone}`
    : `Call emergency number ${emergency.number}`;

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+18px)]">
          <div className="flex items-center gap-3">
            <Logo size={44} />
            <div>
              <p className="text-xs font-medium text-muted-foreground">{greeting},</p>
              <p className="text-base font-semibold">{name}</p>
            </div>
          </div>
          {/* Compact emergency call pill — dials the user's saved contact when available */}
          <a
            href={sosHref}
            className="inline-flex max-w-[55%] items-center gap-1.5 truncate rounded-full border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive"
            aria-label={sosAria}
          >
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{sosLabel}</span>
          </a>
        </header>

        <TravelBanner />

        <div className="flex-1 space-y-5 px-5 py-6">
          <InstallPrompt />

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
              <p className="mt-0.5 text-xs text-muted-foreground">Pharmacies, GPs, Emergency Depts</p>
            </Link>
          </div>

          {/* Recent assessments (real history) */}
          {history.length > 0 ? (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Recent assessments</h3>
              <div className="space-y-2">
                {history.slice(0, 3).map((a) => (
                  <Link
                    key={a.id}
                    to="/results"
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{a.mainSymptom}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatRelative(a.date)} · {a.action}
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
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-5 text-center">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold">No past check-ins yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your recent AI assessments will show up here for easy reference.
              </p>
            </div>
          )}

          {/* Daily tip */}
          {tip && (
            <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-accent to-background p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Daily tip</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">{tip}</p>
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </PhoneFrame>
  );
}
