import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TravelBanner } from "@/components/TravelBanner";
import { useAssessment } from "@/lib/assessment-store";
import { getEmergencyInfo } from "@/lib/locale";
import { useTravelState } from "@/lib/travel-mode";
import { careLabel } from "@/lib/care-labels";
import { AlertTriangle, ChevronRight, Info, Phone, Sparkles } from "lucide-react";



export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [{ title: "Assessment Results — Medi-Care" }, { name: "robots", content: "noindex" }],
  }),
  component: Results,
});

function computeUrgency(severity: number, additional: string[], mainSymptom: string | null) {
  const hay = `${mainSymptom ?? ""} ${additional.join(" ")}`.toLowerCase();
  const critical =
    /chest pain|shortness of breath|can'?t breathe|difficulty breathing|numb|slurred|severe bleeding/.test(
      hay,
    );
  if (critical || severity >= 8) return "High" as const;
  if (severity >= 5) return "Medium" as const;
  return "Low" as const;
}

type Condition = { name: string; confidence: number; blurb: string };

const conditionsBySymptom: Record<string, Condition[]> = {
  headache: [
    { name: "Tension headache", confidence: 72, blurb: "Common, usually from stress or fatigue." },
    { name: "Migraine", confidence: 41, blurb: "Throbbing pain, often one-sided." },
    { name: "Dehydration", confidence: 28, blurb: "Insufficient fluid intake." },
  ],
  fever: [
    { name: "Viral infection", confidence: 68, blurb: "Often accompanies common colds and flu." },
    { name: "Bacterial infection", confidence: 34, blurb: "May require antibiotics." },
  ],
  cough: [
    { name: "Upper respiratory infection", confidence: 65, blurb: "Common viral illness." },
    { name: "Post-nasal drip", confidence: 38, blurb: "Mucus from the nose to the throat." },
  ],
  "sore throat": [
    { name: "Viral pharyngitis", confidence: 74, blurb: "Most common cause of sore throat." },
    { name: "Strep throat", confidence: 22, blurb: "Bacterial — may need swab testing." },
  ],
  throat: [
    { name: "Viral pharyngitis", confidence: 70, blurb: "Most common cause of throat discomfort." },
    { name: "Laryngitis", confidence: 30, blurb: "Inflammation of the voice box." },
  ],
  "chest pain": [
    { name: "Musculoskeletal pain", confidence: 44, blurb: "Often from strain or posture." },
    { name: "Cardiac cause", confidence: 32, blurb: "Requires urgent medical evaluation." },
  ],
  stomach: [
    { name: "Indigestion", confidence: 62, blurb: "Often related to food or stress." },
    { name: "Gastroenteritis", confidence: 34, blurb: "Stomach bug, usually short-lived." },
  ],
  abdominal: [
    { name: "Indigestion", confidence: 60, blurb: "Common cause of abdominal discomfort." },
    { name: "Gastroenteritis", confidence: 36, blurb: "Stomach bug, usually short-lived." },
  ],
  nausea: [
    { name: "Gastroenteritis", confidence: 58, blurb: "Stomach bug, usually short-lived." },
    { name: "Food intolerance", confidence: 30, blurb: "Reaction to something recently eaten." },
  ],
  back: [
    { name: "Muscle strain", confidence: 68, blurb: "Common back pain cause." },
    { name: "Poor posture", confidence: 40, blurb: "Prolonged sitting or lifting." },
  ],
  rash: [
    { name: "Contact dermatitis", confidence: 55, blurb: "Skin reaction to an irritant." },
    { name: "Allergic reaction", confidence: 38, blurb: "Response to an allergen." },
  ],
  dizzy: [
    { name: "Dehydration", confidence: 52, blurb: "Common cause of light-headedness." },
    { name: "Inner-ear disturbance", confidence: 34, blurb: "Balance-related dizziness." },
  ],
  fatigue: [
    { name: "Viral illness", confidence: 58, blurb: "Often accompanies infections." },
    { name: "Sleep deficit", confidence: 42, blurb: "Insufficient or poor-quality sleep." },
  ],
};

function matchConditions(mainSymptom: string | null, additional: string[]): Condition[] {
  const hay = `${mainSymptom ?? ""} ${additional.join(" ")}`.toLowerCase();
  const matched = new Map<string, Condition>();
  for (const key of Object.keys(conditionsBySymptom)) {
    if (hay.includes(key)) {
      for (const c of conditionsBySymptom[key]) {
        const prev = matched.get(c.name);
        if (!prev || prev.confidence < c.confidence) matched.set(c.name, c);
      }
    }
  }
  const list = Array.from(matched.values()).sort((a, b) => b.confidence - a.confidence);
  return list.length > 0
    ? list.slice(0, 4)
    : [
        { name: "Non-specific viral illness", confidence: 58, blurb: "Common self-limiting condition." },
        { name: "Musculoskeletal cause", confidence: 32, blurb: "Related to physical strain." },
      ];
}

function Results() {
  const a = useAssessment();
  const travel = useTravelState();
  const emergency = getEmergencyInfo(
    travel.mode === "away" && travel.currentCountry ? travel.currentCountry : travel.homeCountry,
  );
  const gpLong = careLabel(travel.mode, "long");
  const gpBody =
    travel.mode === "away"
      ? `We recommend seeing a walk-in doctor or local clinic${travel.countryName ? ` in ${travel.countryName}` : ""} within 24–48 hours for a proper evaluation.`
      : "We recommend seeing your GP within 24–48 hours for a proper evaluation.";

  // Prefer AI result; fall back to keyword matcher; red-flag always wins.
  const ai = a.aiResult;
  const urgency: "Low" | "Medium" | "High" = a.redFlag
    ? "High"
    : ai?.urgency ?? computeUrgency(a.severity, a.additional, a.mainSymptom);

  const list: Array<{ name: string; confidence: number; blurb?: string; reasoning?: string }> =
    ai?.conditions.map((c) => ({ name: c.name, confidence: c.confidence, reasoning: c.reasoning })) ??
    matchConditions(a.mainSymptom, a.additional);

  const urgencyMap = {
    Low: {
      label: "Low urgency",
      tone: "bg-success/15 text-success border-success/30",
      ring: "from-success/60 to-success/30",
      next: "Self-care & speak to a pharmacist",
      nextBody: "Rest, hydration and over-the-counter relief should help. See a pharmacist if symptoms persist beyond 3 days.",
      cta: "Show pharmacies near me",
      careType: "Pharmacy" as const,
    },
    Medium: {
      label: "Medium urgency",
      tone: "bg-warning/20 text-warning-foreground border-warning/40",
      ring: "from-warning/70 to-warning/30",
      next: travel.mode === "away" ? `See a ${gpLong.toLowerCase()}` : "Book a GP appointment",
      nextBody: gpBody,
      cta: travel.mode === "away" ? "Show walk-in clinics near me" : "Show GPs near me",
      careType: "GP" as const,
    },
    High: {
      label: "High urgency",
      tone: "bg-destructive/15 text-destructive border-destructive/30",
      ring: "from-destructive/70 to-destructive/30",
      next: a.redFlag ? "Seek urgent care now" : ai?.recommendedAction ?? "Seek urgent care now",
      nextBody: `Go to an Emergency Department or urgent care clinic. If severe, call ${emergency.number} immediately.`,
      cta: "Show urgent care near me",
      careType: "Urgent Care" as const,
    },
  }[urgency];



  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        <ScreenHeader title="AI assessment" back="/assess" right={
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-primary">
            <Sparkles className="h-3 w-3" /> Beta
          </span>
        } />

        <TravelBanner />

        <div className="flex-1 space-y-5 px-5 py-5">

          {/* Urgency hero */}
          <div className={`relative overflow-hidden rounded-3xl border p-5 shadow-card animate-scale-in ${urgencyMap.tone}`}>
            <div className={`pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-gradient-to-br ${urgencyMap.ring} opacity-40 blur-3xl`} />
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Urgency level</p>
            <h2 className="mt-1 font-display text-3xl font-semibold">{urgencyMap.label}</h2>
            <p className="mt-2 text-sm opacity-90">
              Based on {a.mainSymptom || "your symptom"}, severity {a.severity}/10
              {a.additional.length ? ` and ${a.additional.length} related symptoms` : ""}.
            </p>
          </div>

          {urgency === "High" && (
            <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-destructive">
                  If life-threatening, call {emergency.number} now.
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Chest pain, difficulty breathing, sudden weakness, severe bleeding.
                </p>
              </div>
              <a
                href={`tel:${emergency.number}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground shadow-soft"
              >
                <Phone className="h-3 w-3" /> Call {emergency.number}
              </a>
            </div>
          )}

          {/* Recommended next step */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recommended next step</p>
            <h3 className="mt-1 font-display text-xl font-semibold">{urgencyMap.next}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{urgencyMap.nextBody}</p>
            <Link
              to="/care"
              search={{ type: urgencyMap.careType }}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl gradient-primary text-sm font-semibold text-primary-foreground shadow-soft"
            >
              {urgencyMap.cta}
            </Link>
          </div>


          {/* Possible conditions */}
          <div>
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Possible conditions
            </h3>
            <div className="space-y-2">
              {list.map((c) => (
                <div key={c.name} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{c.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{c.blurb}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-primary">
                      {c.confidence}%
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full gradient-primary" style={{ width: `${c.confidence}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/50 p-4">
            <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Guidance only.</span> This is not a medical diagnosis. Always consult a qualified healthcare professional for medical advice.
            </p>
          </div>

          <Link to="/care" className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-card hover:shadow-soft">
            <span className="text-sm font-semibold">Find care near me</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>

        <BottomNav />
      </div>
    </PhoneFrame>
  );
}
