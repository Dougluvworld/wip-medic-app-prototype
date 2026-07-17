import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ProviderMap } from "@/components/ProviderMap";
import { providers } from "@/lib/mock-data";
import { Calendar, CheckCircle2, Clock, Info, MapPin, Navigation, Phone, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { isOpenNow, currentHoursLabel } from "@/lib/hours";


export const Route = createFileRoute("/care/$id")({
  head: ({ params }) => {
    const p = providers.find((x) => x.id === params.id);
    return {
      meta: [
        { title: `${p?.name ?? "Provider"} — Medi-Care` },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  loader: ({ params }) => {
    const p = providers.find((x) => x.id === params.id);
    if (!p) throw notFound();
    return p;
  },
  notFoundComponent: () => (
    <PhoneFrame>
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">Provider not found.</p>
        <Link to="/care" className="mt-4 inline-flex text-sm font-semibold text-primary">← Back to Care</Link>
      </div>
    </PhoneFrame>
  ),
  errorComponent: ({ error, reset }) => (
    <PhoneFrame>
      <div className="p-6 text-center">
        <p className="text-sm text-destructive">{error.message}</p>
        <button onClick={reset} className="mt-4 text-sm font-semibold text-primary">Retry</button>
      </div>
    </PhoneFrame>
  ),
  component: ProviderDetail,
});

function ProviderDetail() {
  const p = Route.useLoaderData();
  const [booked, setBooked] = useState(false);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const openNow = isOpenNow(p.schedule, now);
  const hoursLabel = currentHoursLabel(p.schedule, now);
  const hasPhone = p.phone.trim().length > 0;
  const telHref = `tel:${p.phone.replace(/\s+/g, "")}`;
  const mapsHref =
    typeof p.lat === "number" && typeof p.lng === "number"
      ? `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`
      : `https://maps.google.com/?q=${encodeURIComponent(p.address || p.name)}`;

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        <ScreenHeader back="auto" backFallback="/care" right={
          <button
            aria-label="Share provider"
            className="grid h-10 w-10 place-items-center rounded-full bg-muted text-foreground hover:bg-accent"
          >
            <Share2 className="h-4 w-4" />
          </button>
        } />

        {/* Hero */}
        <div className="relative overflow-hidden px-5 pb-6 pt-2">
          <div className="rounded-3xl gradient-primary p-6 text-primary-foreground shadow-float">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary-foreground/80">
                {p.type}
              </p>
              {p.sample && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                  Sample
                </span>
              )}
            </div>
            <h1 className="mt-1 font-display text-2xl font-semibold leading-tight">{p.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-primary-foreground/90">
              <span className="inline-flex items-center gap-1">
                <Navigation className="h-3.5 w-3.5" /> ~{p.distanceKm} km · ~{p.travelMin} min
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {p.sample ? "Sample hours" : (openNow ? "Open now" : "Closed")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 px-5">
          {p.sample && (
            <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-accent/50 p-3">
              <Info className="h-4 w-4 shrink-0 text-primary" />
              <p className="text-[11px] leading-relaxed text-foreground/80">
                This is a sample provider used to demonstrate the experience.
                Live details — including phone, hours and reviews — will be connected in a future release.
              </p>
            </div>
          )}

          {/* Primary call CTA */}
          {hasPhone ? (
            <a
              href={telHref}
              className="flex items-center gap-3 rounded-2xl bg-success p-4 text-success-foreground shadow-soft active:scale-[0.99]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/20">
                <Phone className="h-5 w-5" />
              </span>
              <span className="flex-1 text-left">
                <span className="block text-sm font-semibold">Call {p.phone}</span>
                <span className="block text-[11px] opacity-90">Tap to dial</span>
              </span>
            </a>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Phone className="h-5 w-5" />
              </span>
              <span className="flex-1 text-left">
                <span className="block text-sm font-semibold">Phone</span>
                <span className="block text-[11px] text-muted-foreground">
                  Available when connected to live provider data.
                </span>
              </span>
            </div>
          )}

          {/* Secondary actions */}
          <div className="grid grid-cols-2 gap-3">
            <a href={mapsHref} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card active:scale-[0.98]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary"><Navigation className="h-4 w-4" /></span>
              <span className="text-[11px] font-semibold">Directions</span>
            </a>
            <button
              onClick={() => setBooked(true)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card active:scale-[0.98]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/15 text-secondary"><Calendar className="h-4 w-4" /></span>
              <span className="text-[11px] font-semibold">Book — soon</span>
            </button>
          </div>

          {booked && (
            <div className="rounded-2xl border border-primary/25 bg-accent/50 p-4 text-sm animate-fade-in">
              <p className="font-semibold text-primary">Booking will be available in a future release</p>
              <p className="mt-0.5 text-xs text-muted-foreground">In the meantime, call the provider directly.</p>
            </div>
          )}

          {/* Trust chips */}
          {p.badges && p.badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {p.badges.map((b: string) => (
                <span key={b} className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground/80 shadow-card">
                  <CheckCircle2 className="h-3 w-3 text-success" /> {b}
                </span>
              ))}
            </div>
          )}

          {/* Info rows */}
          <InfoRow
            icon={<MapPin className="h-4 w-4" />}
            label="Address"
            value={p.address || "—"}
            sub={p.sample ? "Sample location" : undefined}
          />
          <InfoRow
            icon={<Clock className="h-4 w-4" />}
            label="Hours"
            value={p.sample ? "Available when connected to live provider data" : hoursLabel}
          />

          {/* Map mini */}
          <ProviderMap providers={[p]} height={160} />

          {/* About */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <h3 className="text-sm font-semibold">About</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {p.type === "Pharmacy" && "Community pharmacy for prescriptions, minor ailments advice and health checks."}
              {p.type === "GP" && "General practice for routine consultations, chronic-disease reviews and same-day triage."}
              {p.type === "Urgent Care" && "Walk-in urgent care for injuries and illnesses that need same-day care but aren't life-threatening."}
              {p.type === "Hospital" && "Emergency Department for serious injuries and life-threatening conditions."}
            </p>
          </div>

          <div className="h-24" />
        </div>

        <div className="sticky bottom-0 border-t border-border/60 bg-background/90 px-5 py-4 backdrop-blur">
          <div className="flex gap-2">
            {hasPhone ? (
              <a
                href={telHref}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl gradient-primary text-base font-semibold text-primary-foreground shadow-soft active:scale-[0.98]"
              >
                <Phone className="h-4 w-4" /> Call now
              </a>
            ) : (
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl gradient-primary text-base font-semibold text-primary-foreground shadow-soft active:scale-[0.98]"
              >
                <Navigation className="h-4 w-4" /> Directions
              </a>
            )}
          </div>
        </div>

        <BottomNav />
      </div>
    </PhoneFrame>
  );
}

function InfoRow({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}
