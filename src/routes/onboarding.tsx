import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Brain, Compass, HeartPulse } from "lucide-react";
import { markOnboarded } from "@/lib/profile-store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Welcome — Medi-Care" }, { name: "robots", content: "noindex" }],
  }),
  component: Onboarding,
});

const steps = [
  {
    icon: Brain,
    title: "AI symptom assessment",
    body: "Answer a few simple questions. Our clinically-informed AI understands your symptoms and their urgency.",
  },
  {
    icon: Compass,
    title: "Healthcare navigation",
    body: "We guide you to the right care — pharmacy, GP, urgent care or A&E — based on where you are.",
  },
  {
    icon: HeartPulse,
    title: "Personal medical profile",
    body: "Keep allergies, conditions and medications in one secure place for smarter, safer guidance.",
  },
];

function Onboarding() {
  const [i, setI] = useState(0);
  const nav = useNavigate();
  const step = steps[i];
  const Icon = step.icon;
  const last = i === steps.length - 1;

  const finish = () => {
    markOnboarded();
    nav({ to: "/home" });
  };

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col px-6 pt-[calc(env(safe-area-inset-top)+20px)]">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? "w-8 bg-primary" : "w-4 bg-border"
                }`}
              />
            ))}
          </div>
          <Link
            to="/home"
            onClick={() => markOnboarded()}
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            Skip
          </Link>
        </div>

        <div key={i} className="flex flex-1 flex-col items-center justify-center text-center animate-fade-in-up">
          <div className="mb-8 grid h-40 w-40 place-items-center rounded-[36px] gradient-primary text-primary-foreground shadow-float">
            <Icon className="h-16 w-16" strokeWidth={1.6} />
          </div>
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight">
            {step.title}
          </h2>
          <p className="mt-4 max-w-[300px] text-[15px] leading-relaxed text-muted-foreground">
            {step.body}
          </p>
        </div>

        <div className="space-y-3 pb-10">
          <button
            onClick={() => (last ? finish() : setI(i + 1))}
            className="flex h-14 w-full items-center justify-center rounded-2xl gradient-primary text-base font-semibold text-primary-foreground shadow-soft transition-transform active:scale-[0.98]"
          >
            {last ? "Get started" : "Continue"}
          </button>
          {i > 0 && (
            <button
              onClick={() => setI(i - 1)}
              className="flex h-11 w-full items-center justify-center text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Back
            </button>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}
