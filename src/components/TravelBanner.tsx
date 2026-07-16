import { Plane, X } from "lucide-react";
import { shouldShowTravelBanner, useTravelState } from "@/lib/travel-mode";

export function TravelBanner() {
  const s = useTravelState();
  if (!shouldShowTravelBanner(s)) return null;

  return (
    <div className="mx-5 mt-3 flex items-start gap-3 rounded-2xl border border-primary/25 bg-accent p-3.5 shadow-soft animate-fade-in">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-soft">
        <Plane className="h-4 w-4 -rotate-12" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          Looks like you're in {s.countryName}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Show local care instead of your usual GP?
        </p>
        <div className="mt-2.5 flex gap-2">
          <button
            onClick={() => s.setMode("away")}
            className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft active:scale-95"
          >
            Yes, I'm travelling
          </button>
          <button
            onClick={() => s.setMode("home")}
            className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:border-primary/40"
          >
            I'm home
          </button>
        </div>
      </div>
      <button
        onClick={s.dismiss}
        aria-label="Dismiss"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
