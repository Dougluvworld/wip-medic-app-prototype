import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ReviewCard } from "@/components/ReviewCard";
import { providers } from "@/lib/mock-data";
import { Calendar, CheckCircle2, Clock, MapPin, MessageSquare, Navigation, Phone, Share2, ShieldCheck, Star } from "lucide-react";
import { useState } from "react";

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
  const telHref = `tel:${p.phone.replace(/\s+/g, "")}`;
  const smsHref = `sms:${p.phone.replace(/\s+/g, "")}`;
  const mapsHref = `https://maps.google.com/?q=${encodeURIComponent(p.address)}`;
  const breakdown = p.ratingBreakdown ?? { 5: 70, 4: 20, 3: 6, 2: 3, 1: 1 };
  const totalBreakdown = breakdown[5] + breakdown[4] + breakdown[3] + breakdown[2] + breakdown[1];

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        <ScreenHeader back="/care" right={
          <button className="grid h-10 w-10 place-items-center rounded-full bg-muted text-foreground hover:bg-accent">
            <Share2 className="h-4 w-4" />
          </button>
        } />

        {/* Hero */}
        <div className="relative overflow-hidden px-5 pb-6 pt-2">
          <div className="rounded-3xl gradient-primary p-6 text-primary-foreground shadow-float">
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary-foreground/80">
              {p.type} · {p.openNow ? "Open now" : "Closed"}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold leading-tight">{p.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-primary-foreground/90">
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-current text-warning" /> {p.rating} ({p.reviews})
              </span>
              <span className="inline-flex items-center gap-1">
                <Navigation className="h-3.5 w-3.5" /> {p.distanceKm} km · {p.travelMin} min
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 px-5">
          {/* Primary call CTA */}
          <a
            href={telHref}
            className="flex items-center gap-3 rounded-2xl bg-success p-4 text-success-foreground shadow-soft active:scale-[0.99]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/20">
              <Phone className="h-5 w-5" />
            </span>
            <span className="flex-1 text-left">
              <span className="block text-sm font-semibold">Call {p.phone}</span>
              <span className="block text-[11px] opacity-90">Usually answers in under 1 min</span>
            </span>
          </a>

          {/* Secondary actions */}
          <div className="grid grid-cols-3 gap-3">
            <a href={mapsHref} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card active:scale-[0.98]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary"><Navigation className="h-4 w-4" /></span>
              <span className="text-[11px] font-semibold">Directions</span>
            </a>
            <a href={smsHref} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card active:scale-[0.98]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><MessageSquare className="h-4 w-4" /></span>
              <span className="text-[11px] font-semibold">Message</span>
            </a>
            <button
              onClick={() => setBooked(true)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-card active:scale-[0.98]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/15 text-secondary"><Calendar className="h-4 w-4" /></span>
              <span className="text-[11px] font-semibold">Book</span>
            </button>
          </div>

          {booked && (
            <div className="rounded-2xl border border-success/30 bg-success/10 p-4 text-sm text-success animate-fade-in">
              <p className="font-semibold">Appointment request sent</p>
              <p className="mt-0.5 text-xs opacity-90">We'll text you a reminder before your visit (demo).</p>
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

          {/* Address */}
          <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={p.address} />
          <InfoRow icon={<Clock className="h-4 w-4" />} label="Hours" value={p.hours} sub={`Mon–Fri 08:00–20:00 · Sat 09:00–18:00${p.updatedAgo ? ` · ${p.updatedAgo}` : ""}`} />
          <a href={telHref} className="block">
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={p.phone} sub="Tap to call" />
          </a>

          {/* Map mini */}
          <div className="relative h-40 overflow-hidden rounded-3xl border border-border shadow-card">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "linear-gradient(oklch(0.94 0.02 180) 1px, transparent 1px), linear-gradient(90deg, oklch(0.94 0.02 180) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                backgroundColor: "oklch(0.98 0.01 180)",
              }}
            />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
              <div className="grid h-10 w-10 place-items-center rounded-full gradient-primary text-primary-foreground shadow-float">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* About */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <h3 className="text-sm font-semibold">About</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {p.type === "Pharmacy" && "Community pharmacy offering prescription services, minor ailments advice and health checks. HSE registered."}
              {p.type === "GP" && "General Practice offering routine consultations, chronic-disease reviews and same-day triage."}
              {p.type === "Urgent Care" && "Walk-in urgent care clinic for injuries and illnesses that need same-day care but aren't life-threatening."}
              {p.type === "Hospital" && "24-hour Emergency Department for serious injuries and life-threatening conditions."}
            </p>
          </div>

          {/* Reviews */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">What people say</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success">
                <ShieldCheck className="h-3 w-3" /> Verified reviews
              </span>
            </div>

            <div className="mt-3 flex items-center gap-4">
              <div className="text-center">
                <p className="font-display text-3xl font-semibold leading-none">{p.rating.toFixed(1)}</p>
                <div className="mt-1 flex justify-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < Math.round(p.rating) ? "fill-current text-warning" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{p.reviews} reviews</p>
              </div>
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const pct = totalBreakdown ? (breakdown[star as 1 | 2 | 3 | 4 | 5] / totalBreakdown) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-3 text-[10px] text-muted-foreground">{star}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-warning" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-[10px] text-muted-foreground">{Math.round(pct)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {p.reviewList && p.reviewList.length > 0 && (
              <div className="mt-4 space-y-3">
                {p.reviewList.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
                <button className="w-full rounded-xl border border-border py-2 text-xs font-semibold text-foreground/80 hover:bg-accent">
                  See all {p.reviews} reviews
                </button>
              </div>
            )}
          </div>

          <div className="h-24" />
        </div>

        <div className="sticky bottom-0 border-t border-border/60 bg-background/90 px-5 py-4 backdrop-blur">
          <div className="flex gap-2">
            <a
              href={telHref}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl gradient-primary text-base font-semibold text-primary-foreground shadow-soft active:scale-[0.98]"
            >
              <Phone className="h-4 w-4" /> Call now
            </a>
            <button
              onClick={() => setBooked(true)}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 text-sm font-semibold text-foreground shadow-card active:scale-[0.98]"
            >
              <Calendar className="h-4 w-4" /> Book
            </button>
          </div>
        </div>
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
