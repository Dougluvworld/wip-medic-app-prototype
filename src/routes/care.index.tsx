import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TravelBanner } from "@/components/TravelBanner";
import { providers, type Provider } from "@/lib/mock-data";
import { useTravelState } from "@/lib/travel-mode";
import { careLabel } from "@/lib/care-labels";
import { Clock, MapPin, Navigation, Star } from "lucide-react";
import { useState, useEffect } from "react";


const filters = ["All", "Pharmacy", "GP", "Urgent Care", "Hospital"] as const;
type Filter = (typeof filters)[number];

export const Route = createFileRoute("/care/")({
  head: () => ({
    meta: [{ title: "Find Care Nearby — Medi-Care" }, { name: "robots", content: "noindex" }],
  }),
  validateSearch: (s: Record<string, unknown>): { type?: Filter } => {
    const t = typeof s.type === "string" ? s.type : undefined;
    return { type: (filters as readonly string[]).includes(t ?? "") ? (t as Filter) : undefined };
  },
  component: Care,
});

function Care() {
  const { type } = Route.useSearch();
  const [filter, setFilter] = useState<Filter>(type ?? "All");
  useEffect(() => { if (type) setFilter(type); }, [type]);
  const travel = useTravelState();
  const list = providers.filter((p) => filter === "All" || p.type === filter);
  const filterLabel = (f: Filter) => (f === "GP" ? careLabel(travel.mode) : f);
  const subtitle = travel.mode === "away" && travel.countryName ? travel.countryName : "Dublin, Ireland";

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        <ScreenHeader title="Care nearby" subtitle={subtitle} back="/home" />

        <TravelBanner />

        {/* Map placeholder */}
        <div className="px-5 pt-4">

          <div className="relative h-44 overflow-hidden rounded-3xl border border-border shadow-card">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(oklch(0.94 0.02 180) 1px, transparent 1px), linear-gradient(90deg, oklch(0.94 0.02 180) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
                backgroundColor: "oklch(0.98 0.01 180)",
              }}
            />
            {/* Roads */}
            <div className="absolute left-0 right-0 top-1/3 h-1.5 bg-[oklch(0.9_0.02_180)]" />
            <div className="absolute bottom-1/4 left-0 right-0 h-1.5 bg-[oklch(0.9_0.02_180)]" />
            <div className="absolute inset-y-0 left-1/2 w-1.5 bg-[oklch(0.9_0.02_180)]" />
            {/* Pins */}
            {[
              { top: "22%", left: "30%" },
              { top: "48%", left: "55%" },
              { top: "62%", left: "20%" },
              { top: "34%", left: "72%" },
            ].map((s, i) => (
              <div key={i} className="absolute" style={s}>
                <div className="grid h-8 w-8 -translate-x-1/2 -translate-y-full place-items-center rounded-full gradient-primary text-primary-foreground shadow-float">
                  <MapPin className="h-4 w-4" />
                </div>
              </div>
            ))}
            {/* You are here */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="animate-pulse-ring h-4 w-4 rounded-full bg-secondary" />
                <div className="absolute inset-0 h-4 w-4 rounded-full bg-secondary ring-2 ring-white" />
              </div>
            </div>
            <div className="absolute bottom-3 left-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold shadow-soft backdrop-blur">
              📍 You are here
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="scrollbar-none overflow-x-auto px-5 pt-4">
          <div className="flex min-w-max gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                  filter === f
                    ? "border-primary bg-primary text-primary-foreground shadow-soft"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                {filterLabel(f)}

              </button>
            ))}
          </div>
        </div>

        {/* Provider list */}
        <div className="flex-1 space-y-3 px-5 py-4">
          {list.map((p) => (
            <ProviderCard key={p.id} p={p} />
          ))}
          {list.length === 0 && (
            <p className="pt-8 text-center text-sm text-muted-foreground">No results for this filter.</p>
          )}
        </div>

        <BottomNav />
      </div>
    </PhoneFrame>
  );
}

const typeStyle: Record<Provider["type"], string> = {
  Pharmacy: "bg-success/15 text-success",
  GP: "bg-accent text-primary",
  "Urgent Care": "bg-warning/20 text-warning-foreground",
  Hospital: "bg-destructive/10 text-destructive",
};

function ProviderCard({ p }: { p: Provider }) {
  return (
    <Link
      to="/care/$id"
      params={{ id: p.id }}
      className="block rounded-2xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-soft">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeStyle[p.type]}`}>
              {p.type}
            </span>
            {p.openNow && (
              <span className="text-[10px] font-semibold text-success">● Open now</span>
            )}
          </div>
          <p className="mt-1 truncate text-sm font-semibold">{p.name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Navigation className="h-3 w-3" /> {p.distanceKm} km · {p.travelMin} min
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {p.hours}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-current text-warning" /> {p.rating} ({p.reviews})
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
