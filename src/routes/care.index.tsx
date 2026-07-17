import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TravelBanner } from "@/components/TravelBanner";
import { ProviderMap } from "@/components/ProviderMap";
import { providers, type Provider } from "@/lib/mock-data";
import { useTravelState } from "@/lib/travel-mode";
import { careLabel } from "@/lib/care-labels";
import { useAssessment } from "@/lib/assessment-store";
import { scoreProvider } from "@/lib/care-recommendation";
import { haversineKm, useUserLocation } from "@/lib/use-user-location";
import { Clock, MapPin, Navigation, Sparkles, Star, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";


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
  const assessment = useAssessment();
  const rec = assessment.careRecommendation;
  const initial: Filter = type ?? (rec?.types[0] ?? "All");
  const [filter, setFilter] = useState<Filter>(initial);
  const [recDismissed, setRecDismissed] = useState(false);
  useEffect(() => { if (type) setFilter(type); }, [type]);
  const travel = useTravelState();
  const { coords } = useUserLocation();

  // Recompute distances from user coords when available.
  const enriched: Provider[] = useMemo(() => {
    if (!coords) return providers;
    return providers.map((p) => {
      if (typeof p.lat !== "number" || typeof p.lng !== "number") return p;
      const km = haversineKm(coords, { lat: p.lat, lng: p.lng });
      return {
        ...p,
        distanceKm: Number(km.toFixed(1)),
        travelMin: Math.max(1, Math.round(km * 12)),
      };
    });
  }, [coords]);

  const list = useMemo(() => {
    const filtered = enriched.filter((p) => filter === "All" || p.type === filter);
    return [...filtered].sort((a, b) => scoreProvider(b, rec) - scoreProvider(a, rec));
  }, [enriched, filter, rec]);

  const filterLabel = (f: Filter) => (f === "GP" ? careLabel(travel.mode) : f);
  const subtitle = travel.mode === "away" && travel.countryName ? travel.countryName : "Dublin, Ireland";

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        <ScreenHeader title="Care nearby" subtitle={subtitle} back="/home" />

        <TravelBanner />

        {/* Real map */}
        <div className="px-5 pt-4">
          <ProviderMap providers={list} userLocation={coords} height={176} />
        </div>

        {/* Recommendation banner from latest assessment */}
        {rec && !recDismissed && (
          <div className="mx-5 mt-3 flex items-start gap-3 rounded-2xl border border-primary/30 bg-accent/60 p-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-soft">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Recommended for your assessment</p>
              <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">{rec.reason}</p>
            </div>
            <button
              onClick={() => setRecDismissed(true)}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="scrollbar-none overflow-x-auto px-5 pt-3">
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
            <ProviderCard key={p.id} p={p} recommended={rec ? rec.types.includes(p.type) : false} />
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

function ProviderCard({ p, recommended }: { p: Provider; recommended: boolean }) {
  return (
    <Link
      to="/care/$id"
      params={{ id: p.id }}
      className={`block rounded-2xl border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft ${
        recommended ? "border-primary/40 ring-1 ring-primary/20" : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-soft">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeStyle[p.type]}`}>
              {p.type}
            </span>
            {recommended && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-2.5 w-2.5" /> Recommended
              </span>
            )}
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
