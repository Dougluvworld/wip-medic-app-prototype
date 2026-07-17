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
import { Building2, Clock, FlaskConical, HeartPulse, Info, MapPin, MapPinOff, Navigation, Phone, Search, Sparkles, Stethoscope, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { isOpenNow, currentHoursLabel } from "@/lib/hours";
import { useNavigate } from "@tanstack/react-router";

const filters = ["All", "Pharmacy", "GP", "Urgent Care", "Hospital"] as const;
type Filter = (typeof filters)[number];

const LOCATION_DISMISSED_KEY = "medi-care.location-prompt-dismissed";

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
  const { coords, status, request } = useUserLocation();

  const [locationDismissed, setLocationDismissed] = useState(false);
  useEffect(() => {
    try {
      setLocationDismissed(window.localStorage.getItem(LOCATION_DISMISSED_KEY) === "1");
    } catch { /* ignore */ }
  }, []);

  const dismissLocationPrompt = () => {
    setLocationDismissed(true);
    try { window.localStorage.setItem(LOCATION_DISMISSED_KEY, "1"); } catch { /* ignore */ }
  };

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const enriched: Provider[] = useMemo(() => {
    return providers.map((p) => {
      const openNow = isOpenNow(p.schedule, now);
      const hours = currentHoursLabel(p.schedule, now);
      let distanceKm = p.distanceKm;
      let travelMin = p.travelMin;
      if (coords && typeof p.lat === "number" && typeof p.lng === "number") {
        const km = haversineKm(coords, { lat: p.lat, lng: p.lng });
        distanceKm = Number(km.toFixed(1));
        travelMin = Math.max(1, Math.round(km * 12));
      }
      return { ...p, openNow, hours, distanceKm, travelMin };
    });
  }, [coords, now]);

  const list = useMemo(() => {
    const filtered = enriched.filter((p) => filter === "All" || p.type === filter);
    return [...filtered].sort((a, b) => scoreProvider(b, rec) - scoreProvider(a, rec));
  }, [enriched, filter, rec]);

  const filterLabel = (f: Filter) => (f === "GP" ? careLabel(travel.mode) : f);
  const subtitle = travel.mode === "away" && travel.countryName ? travel.countryName : "Sample area";

  const showLocationPrompt = !coords && !locationDismissed && status !== "denied" && status !== "unavailable";
  const anySample = list.some((p) => p.sample);

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        <ScreenHeader title="Care nearby" subtitle={subtitle} back="auto" backFallback="/home" />

        <TravelBanner />

        {/* Prototype transparency banner */}
        {anySample && (
          <div className="mx-5 mt-3 flex items-start gap-3 rounded-2xl border border-primary/25 bg-accent/60 p-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Info className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold">Prototype preview</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                This prototype currently demonstrates how nearby healthcare providers will be displayed.
                Live provider data will be connected in a future release.
              </p>
            </div>
          </div>
        )}

        <div className="px-5 pt-3">
          <ProviderMap providers={list} userLocation={coords} height={176} />
        </div>

        {/* Location permission prompt */}
        {showLocationPrompt && (
          <div className="mx-5 mt-3 flex items-start gap-3 rounded-2xl border border-border bg-card p-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent text-primary">
              <MapPin className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">Enable location for accurate distances</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                We'll only use it while you're on this screen.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={request}
                className="rounded-full gradient-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-soft"
              >
                Enable
              </button>
              <button
                onClick={dismissLocationPrompt}
                className="rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                Not now
              </button>
            </div>
          </div>
        )}

        {/* Empty-state education when no assessment has been completed */}
        {!rec && (
          <div className="mx-5 mt-3 flex items-start gap-3 rounded-2xl border border-border bg-card p-3 shadow-card">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent text-primary">
              <MapPin className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">Find the right care nearby</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                Browse pharmacies, GPs, urgent care and emergency departments around you.
              </p>
              <Link
                to="/assess"
                className="mt-2 inline-flex items-center gap-1.5 rounded-full gradient-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-soft"
              >
                <Stethoscope className="h-3 w-3" /> Start a quick assessment
              </Link>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Completing an assessment personalises which type of care is recommended.
              </p>
            </div>
          </div>
        )}

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
              aria-label="Dismiss recommendation"
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
          {anySample && (
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sample healthcare providers
              </h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Prototype
              </span>
            </div>
          )}
          {list.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Search className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold">No {filterLabel(filter).toLowerCase()} nearby</p>
              <p className="mt-1 text-xs text-muted-foreground">Try a different filter to see more results.</p>
              <button
                onClick={() => setFilter("All")}
                className="mt-4 inline-flex h-9 items-center justify-center rounded-full gradient-primary px-4 text-xs font-semibold text-primary-foreground shadow-soft"
              >
                Show all providers
              </button>
            </div>
          ) : (
            list.map((p) => <ProviderCard key={p.id} p={p} hasCoords={!!coords} />)
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

const typeIcon: Record<Provider["type"], React.ComponentType<{ className?: string }>> = {
  Pharmacy: FlaskConical,
  GP: Stethoscope,
  "Urgent Care": HeartPulse,
  Hospital: Building2,
};

function ProviderCard({ p, hasCoords }: { p: Provider; hasCoords: boolean }) {
  const nav = useNavigate();
  const TypeIcon = typeIcon[p.type];
  const mapsHref =
    typeof p.lat === "number" && typeof p.lng === "number"
      ? `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`
      : `https://maps.google.com/?q=${encodeURIComponent(p.name)}`;
  const hasPhone = p.phone.trim().length > 0;

  const open = () => nav({ to: "/care/$id", params: { id: p.id } });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => { if (e.key === "Enter") open(); }}
      className="block cursor-pointer rounded-2xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-soft">
          <TypeIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeStyle[p.type]}`}>
              {p.type}
            </span>
            {p.sample && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Sample
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-sm font-semibold">{p.name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              {hasCoords ? (
                <><Navigation className="h-3 w-3" /> {p.distanceKm} km · ~{p.travelMin} min</>
              ) : (
                <><MapPinOff className="h-3 w-3" /> ~{p.distanceKm} km · ~{p.travelMin} min</>
              )}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {p.sample ? "Hours available when connected" : (p.openNow ? "Open now" : p.hours)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {hasPhone ? (
          <a
            href={`tel:${p.phone.replace(/\s+/g, "")}`}
            onClick={(e) => e.stopPropagation()}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl gradient-primary text-xs font-semibold text-primary-foreground shadow-soft"
            aria-label={`Call ${p.name}`}
          >
            <Phone className="h-3.5 w-3.5" /> Call
          </a>
        ) : (
          <span
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-muted text-[11px] font-semibold text-muted-foreground"
            title="Available when connected to live provider data"
          >
            <Phone className="h-3.5 w-3.5" /> Call — soon
          </span>
        )}
        <a
          href={mapsHref}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-accent"
          aria-label={`Directions to ${p.name}`}
        >
          <Navigation className="h-3.5 w-3.5" /> Directions
        </a>
      </div>
    </div>
  );
}
