import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAssessment } from "@/lib/assessment-store";
import { AlertTriangle, ChevronRight, Info, Sparkles } from "lucide-react";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [{ title: "Assessment Results — Medi-Care" }, { name: "robots", content: "noindex" }],
  }),
  component: Results,
});

function computeUrgency(severity: number, additional: string[]) {
  const critical = additional.some((s) => ["Chest pain", "Shortness of breath"].includes(s));
  if (critical || severity >= 8) return "High" as const;
  if (severity >= 5) return "Medium" as const;
  return "Low" as const;
}

const conditionsBySymptom: Record<string, { name: string; confidence: number; blurb: string }[]> = {
  Headache: [
    { name: "Tension headache", confidence: 72, blurb: "Common, usually from stress or fatigue." },
    { name: "Migraine", confidence: 41, blurb: "Throbbing pain, often one-sided." },
    { name: "Dehydration", confidence: 28, blurb: "Insufficient fluid intake." },
  ],
  Fever: [
    { name: "Viral infection", confidence: 68, blurb: "Often accompanies common colds and flu." },
    { name: "Bacterial infection", confidence: 34, blurb: "May require antibiotics." },
  ],
  Cough: [
    { name: "Upper respiratory infection", confidence: 65, blurb: "Common viral illness." },
    { name: "Post-nasal drip", confidence: 38, blurb: "Mucus from the nose to the throat." },
  ],
  "Sore throat": [
    { name: "Viral pharyngitis", confidence: 74, blurb: "Most common cause of sore throat." },
    { name: "Strep throat", confidence: 22, blurb: "Bacterial — may need swab testing." },
  ],
  "Chest pain": [
    { name: "Musculoskeletal pain", confidence: 44, blurb: "Often from strain or posture." },
    { name: "Cardiac cause", confidence: 32, blurb: "Requires urgent medical evaluation." },
  ],
};

function Results() {
  const a = useAssessment();
  const urgency = computeUrgency(a.severity, a.additional);
  const list = a.mainSymptom && conditionsBySymptom[a.mainSymptom]
    ? conditionsBySymptom[a.mainSymptom]
    : [
        { name: "Non-specific viral illness", confidence: 58, blurb: "Common self-limiting condition." },
        { name: "Musculoskeletal cause", confidence: 32, blurb: "Related to physical strain." },
      ];

  const urgencyMap = {
    Low: {
      label: "Low urgency",
      tone: "bg-success/15 text-success border-success/30",
      ring: "from-success/60 to-success/30",
      next: "Self-care & monitor",
      nextBody: "Rest, hydration and over-the-counter relief should help. See a pharmacist if symptoms persist beyond 3 days.",
      cta: "Find a pharmacy",
      to: "/care" as const,
    },
    Medium: {
      label: "Medium urgency",
      tone: "bg-warning/20 text-warning-foreground border-warning/40",
      ring: "from-warning/70 to-warning/30",
      next: "Book a GP appointment",
      nextBody: "We recommend seeing your GP within 24–48 hours for a proper evaluation.",
      cta: "Find a GP",
      to: "/care" as const,
    },
    High: {
      label: "High urgency",
      tone: "bg-destructive/15 text-destructive border-destructive/30",
      ring: "from-destructive/70 to-destructive/30",
      next: "Seek urgent care now",
      nextBody: "Go to an Urgent Treatment Centre or A&E. If severe, call 999 immediately.",
      cta: "Find urgent care",
      to: "/care" as const,
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
                <p className="text-sm font-semibold text-destructive">If life-threatening, call 999 now.</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Chest pain, difficulty breathing, sudden weakness, severe bleeding.</p>
              </div>
              <a href="tel:999" className="rounded-full bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground shadow-soft">
                Call 999
              </a>
            </div>
          )}

          {/* Recommended next step */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recommended next step</p>
            <h3 className="mt-1 font-display text-xl font-semibold">{urgencyMap.next}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{urgencyMap.nextBody}</p>
            <Link
              to={urgencyMap.to}
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
