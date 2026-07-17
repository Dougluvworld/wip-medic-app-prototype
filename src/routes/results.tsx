import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TravelBanner } from "@/components/TravelBanner";
import { assessmentStore, useAssessment } from "@/lib/assessment-store";
import { getEmergencyInfo } from "@/lib/locale";
import { useTravelState } from "@/lib/travel-mode";
import { careLabel } from "@/lib/care-labels";
import { recommendCareTypes } from "@/lib/care-recommendation";
import { saveHistoryEntry } from "@/lib/history-store";
import { loadProfile } from "@/lib/profile-store";
import { AlertTriangle, Copy, Info, Phone, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

type Condition = { name: string; confidence: number; blurb?: string; reasoning?: string };

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

// Rank-based labels — guarantees a visible hierarchy regardless of raw scores.
function rankLabel(rank: number): { label: string; tone: string } {
  if (rank === 0) return { label: "Most likely", tone: "bg-primary text-primary-foreground" };
  if (rank === 1)
    return { label: "Also possible", tone: "bg-accent text-primary border border-primary/30" };
  return { label: "Less likely", tone: "bg-muted text-muted-foreground" };
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

  const ai = a.aiResult;
  const urgency: "Low" | "Medium" | "High" = a.redFlag
    ? "High"
    : ai?.urgency ?? computeUrgency(a.severity, a.additional, a.mainSymptom);

  const list: Condition[] =
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

  const recommendation = recommendCareTypes(urgency, a.redFlag);

  // Persist recommendation for /care AND save a history entry once.
  const [saved, setSaved] = useState(false);
  const [ec, setEc] = useState<{ name: string; phone: string }>({ name: "", phone: "" });
  useEffect(() => {
    assessmentStore.set({ careRecommendation: recommendation });
    const p = loadProfile();
    setEc({
      name: (p.emergencyContact?.name ?? "").trim(),
      phone: (p.emergencyContact?.phone ?? "").trim(),
    });
    if (!saved && (a.mainSymptom || a.redFlag)) {
      saveHistoryEntry({
        mainSymptom: a.mainSymptom ?? "Symptom check",
        urgency,
        topCondition: list[0]?.name ?? "Assessment",
        action: urgencyMap.next,
      });
      setSaved(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urgency, a.redFlag]);
  const hasEc = ec.phone.length > 0;

  const copySummary = async () => {
    const lines = [
      `Medi-Care assessment — ${new Date().toLocaleString()}`,
      `Symptom: ${a.mainSymptom ?? "unspecified"} (${a.severity}/10)`,
      `Urgency: ${urgencyMap.label}`,
      `Next step: ${urgencyMap.next}`,
      "",
      "Possible conditions:",
      ...list.slice(0, 3).map((c, i) => `  • ${c.name} — ${rankLabel(i).label}`),
      "",
      "Guidance only — not a medical diagnosis.",
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success("Summary copied to clipboard");
    } catch {
      toast.error("Couldn't copy — try selecting the text manually");
    }
  };

  const printSummary = () => {
    if (typeof window === "undefined") return;
    window.print();
  };


  // Empty-state guard: user hit /results directly without running an assessment.
  const hasData = a.mainSymptom || a.aiResult || a.redFlag;
  if (!hasData) {
    return (
      <PhoneFrame>
        <div className="flex min-h-full flex-col">
          <ScreenHeader title="AI assessment" back="/home" />
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">No assessment yet</h2>
            <p className="mt-2 max-w-[280px] text-sm text-muted-foreground">
              Run a quick symptom check to see your personalised results here.
            </p>
            <Link
              to="/assess"
              className="mt-6 flex h-12 items-center justify-center rounded-2xl gradient-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft"
            >
              Start assessment
            </Link>
          </div>
          <BottomNav />
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        <ScreenHeader
          title="AI assessment"
          back="auto"
          backFallback="/home"
          right={
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-primary">
              <Sparkles className="h-3 w-3" /> Beta
            </span>
          }
        />

        <TravelBanner />

        <div className="flex-1 space-y-5 px-5 py-5">
          {/* Visible AI fallback banner (used to be tiny grey footnote) */}
          {a.aiError && (
            <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
              <Info className="h-4 w-4 shrink-0 text-warning-foreground" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-warning-foreground">Showing a basic assessment</p>
                <p className="mt-1 text-xs text-foreground/80">
                  AI reasoning wasn't available this time. The results below use a keyword-based fallback.
                </p>
              </div>
            </div>
          )}

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

          {/* Red-flag banner */}
          {a.redFlag && (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-destructive">Possible emergency</p>
                  <p className="mt-1 text-xs text-foreground/80">{a.redFlag}</p>
                </div>
              </div>
              <a
                href={`tel:${emergency.number}`}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-destructive text-sm font-semibold text-destructive-foreground shadow-soft"
              >
                <Phone className="h-4 w-4" /> Call {emergency.number} now
              </a>
              {hasEc && (
                <a
                  href={`tel:${ec.phone}`}
                  className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 bg-card text-sm font-semibold text-destructive hover:bg-destructive/5"
                  aria-label={`Call emergency contact ${ec.name || ec.phone}`}
                >
                  <Phone className="h-4 w-4" /> Call {ec.name || "emergency contact"}
                </a>
              )}
            </div>
          )}

          {/* AI urgency reasons */}
          {ai && ai.urgencyReasons.length > 0 && !a.redFlag && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Why this urgency</p>
              <ul className="mt-2 space-y-1.5">
                {ai.urgencyReasons.map((r, i) => (
                  <li key={i} className="text-xs leading-relaxed text-foreground/80">• {r}</li>
                ))}
              </ul>
              {ai.usedProfile && (
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-primary">
                  <Sparkles className="h-3 w-3" /> Personalised using your profile
                </span>
              )}
            </div>
          )}

          {urgency === "High" && !a.redFlag && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-destructive">
                    If life-threatening, call {emergency.number} now.
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Chest pain, difficulty breathing, sudden weakness, severe bleeding.
                  </p>
                </div>
              </div>
              <div className={`mt-3 grid gap-2 ${hasEc ? "grid-cols-2" : "grid-cols-1"}`}>
                <a
                  href={`tel:${emergency.number}`}
                  aria-label={`Call ${emergency.number}`}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-destructive text-xs font-semibold text-destructive-foreground shadow-soft"
                >
                  <Phone className="h-3.5 w-3.5" /> Call {emergency.number}
                </a>
                {hasEc && (
                  <a
                    href={`tel:${ec.phone}`}
                    aria-label={`Call emergency contact ${ec.name || ec.phone}`}
                    className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-destructive/40 bg-card text-xs font-semibold text-destructive hover:bg-destructive/5"
                  >
                    <Phone className="h-3.5 w-3.5" /> Call {ec.name || "contact"}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Recommended next step — the ONE primary CTA */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recommended next step</p>
            <h3 className="mt-1 font-display text-xl font-semibold">{urgencyMap.next}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{urgencyMap.nextBody}</p>
            <Link
              to="/care"
              search={{ type: recommendation.types[0] }}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl gradient-primary text-sm font-semibold text-primary-foreground shadow-soft"
            >
              {urgencyMap.cta}
            </Link>
            <button
              onClick={copySummary}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-accent"
            >
              <Copy className="h-4 w-4" /> Copy summary
            </button>
          </div>

          {/* Possible conditions — qualitative framing */}
          {!a.redFlag && (
            <div>
              <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Possible conditions
              </h3>
              <div className="space-y-2">
                {(() => {
                  const topScore = Math.max(1, ...list.map((c) => c.confidence));
                  return list.map((c, i) => {
                    const l = rankLabel(i);
                    const pct = Math.max(8, Math.round((c.confidence / topScore) * 100));
                    const barTone =
                      i === 0 ? "bg-primary" : i === 1 ? "bg-primary/50" : "bg-muted-foreground/30";
                    const cardTone =
                      i === 0
                        ? "border-primary/40 bg-card ring-1 ring-primary/20"
                        : "border-border bg-card";
                    const nameTone = i >= 2 ? "text-foreground/70" : "text-foreground";
                    return (
                      <div key={c.name} className={`rounded-2xl border p-4 shadow-card ${cardTone}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold ${nameTone}`}>{c.name}</p>
                            {c.blurb && (
                              <p className="mt-0.5 text-xs text-muted-foreground">{c.blurb}</p>
                            )}
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${l.tone}`}
                          >
                            {l.label}
                          </span>
                        </div>
                        <div
                          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                          role="presentation"
                        >
                          <div
                            className={`h-full rounded-full transition-all ${barTone}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {c.reasoning && (
                          <p className="mt-2 text-xs italic leading-relaxed text-muted-foreground">
                            {c.reasoning}
                            <span className="not-italic text-muted-foreground/70">
                              {" "}
                              · {c.confidence}%
                            </span>
                          </p>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

            </div>
          )}

          {/* When to seek help */}
          {ai && ai.whenToSeekHelp.length > 0 && (
            <div className="rounded-2xl border border-warning/40 bg-warning/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-warning-foreground/80">Seek care immediately if</p>
              <ul className="mt-2 space-y-1.5">
                {ai.whenToSeekHelp.map((w, i) => (
                  <li key={i} className="text-xs leading-relaxed text-foreground/80">• {w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/50 p-4">
            <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Guidance only.</span> This is not a medical diagnosis. Always consult a qualified healthcare professional for medical advice.
            </p>
          </div>
        </div>

        <BottomNav />
      </div>
    </PhoneFrame>
  );
}
