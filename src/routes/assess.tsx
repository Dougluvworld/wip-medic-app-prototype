import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { ScreenHeader } from "@/components/ScreenHeader";
import { assessmentStore, useAssessment } from "@/lib/assessment-store";
import { additionalSymptoms, bodyAreas, durations, symptoms } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/assess")({
  head: () => ({
    meta: [{ title: "Symptom Assessment — Medi-Care" }, { name: "robots", content: "noindex" }],
  }),
  component: Assess,
});

function Assess() {
  const [step, setStep] = useState(0);
  const a = useAssessment();
  const nav = useNavigate();
  const steps = ["Main symptom", "Body area", "Duration", "Severity", "Additional"];
  const canContinue = [
    !!a.mainSymptom,
    !!a.bodyArea,
    !!a.duration,
    true,
    true,
  ][step];

  const isLast = step === steps.length - 1;

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        <ScreenHeader
          title="Symptom assessment"
          subtitle={`Step ${step + 1} of ${steps.length} · ${steps[step]}`}
          back={step === 0 ? "/home" : undefined}
        />
        {step > 0 && (
          <div className="px-5 pt-3">
            <button onClick={() => setStep(step - 1)} className="text-xs font-medium text-muted-foreground">← Back</button>
          </div>
        )}

        {/* Progress */}
        <div className="px-5 pt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full gradient-primary transition-all duration-500"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 px-5 py-5">
          {step === 0 && (
            <Question title="What's your main symptom?" hint="Choose the one that concerns you most">
              <ChipGrid
                items={symptoms}
                selected={a.mainSymptom ? [a.mainSymptom] : []}
                onSelect={(v) => assessmentStore.set({ mainSymptom: v })}
              />
            </Question>
          )}
          {step === 1 && (
            <Question title="Where in your body?" hint="Select the primary affected area">
              <ChipGrid
                items={bodyAreas}
                selected={a.bodyArea ? [a.bodyArea] : []}
                onSelect={(v) => assessmentStore.set({ bodyArea: v })}
              />
            </Question>
          )}
          {step === 2 && (
            <Question title="How long have you had it?">
              <div className="space-y-2">
                {durations.map((d) => (
                  <button
                    key={d}
                    onClick={() => assessmentStore.set({ duration: d })}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-sm font-semibold transition-all ${
                      a.duration === d
                        ? "border-primary bg-accent text-primary shadow-soft"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    {d}
                    <span className={`h-5 w-5 rounded-full border-2 ${a.duration === d ? "border-primary bg-primary" : "border-border"}`} />
                  </button>
                ))}
              </div>
            </Question>
          )}
          {step === 3 && (
            <Question title="How severe does it feel?" hint="Slide to indicate intensity">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
                <div className="text-center">
                  <div className="font-display text-6xl font-semibold text-primary">{a.severity}</div>
                  <p className="mt-1 text-xs text-muted-foreground">out of 10</p>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={a.severity}
                  onChange={(e) => assessmentStore.set({ severity: parseInt(e.target.value) })}
                  className="mt-5 w-full accent-[--color-primary]"
                />
                <div className="mt-2 flex justify-between text-[11px] font-medium text-muted-foreground">
                  <span>Mild</span><span>Moderate</span><span>Severe</span>
                </div>
              </div>
            </Question>
          )}
          {step === 4 && (
            <Question title="Any other symptoms?" hint="Select all that apply">
              <div className="flex flex-wrap gap-2">
                {additionalSymptoms.map((s) => {
                  const on = a.additional.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => assessmentStore.toggleAdditional(s)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                        on
                          ? "border-primary bg-primary text-primary-foreground shadow-soft"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </Question>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-border/60 bg-background/90 px-5 py-4 backdrop-blur">
          <button
            disabled={!canContinue}
            onClick={() => (isLast ? nav({ to: "/results" }) : setStep(step + 1))}
            className="flex h-14 w-full items-center justify-center rounded-2xl gradient-primary text-base font-semibold text-primary-foreground shadow-soft transition disabled:opacity-40 active:scale-[0.98]"
          >
            {isLast ? "View AI results" : "Continue"}
          </button>
        </div>

        <BottomNav />
      </div>
    </PhoneFrame>
  );
}

function Question({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="animate-fade-in-up">
      <h2 className="font-display text-2xl font-semibold leading-tight">{title}</h2>
      {hint && <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ChipGrid({ items, selected, onSelect }: { items: string[]; selected: string[]; onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const on = selected.includes(it);
        return (
          <button
            key={it}
            onClick={() => onSelect(it)}
            className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition-all ${
              on
                ? "border-primary bg-primary text-primary-foreground shadow-soft"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            {it}
          </button>
        );
      })}
    </div>
  );
}
