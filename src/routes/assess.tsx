import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { ScreenHeader, Logo } from "@/components/ScreenHeader";
import { assessmentStore } from "@/lib/assessment-store";
import { pickFollowUps, detectRedFlag, type FollowUp } from "@/lib/follow-ups";
import { runAssessment } from "@/lib/assessment.functions";
import { loadProfile } from "@/lib/profile-store";
import { ArrowUp, RefreshCw, SkipForward } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/assess")({
  head: () => ({
    meta: [
      { title: "Symptom Check — Medi-Care" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { demo?: boolean } => ({
    demo: s.demo === "1" || s.demo === true || s.demo === "true",
  }),
  component: Assess,
});

type Msg = { id: string; role: "assistant" | "user"; text: string };

const BODY_MAP: Array<{ re: RegExp; area: string }> = [
  { re: /stomach|belly|tummy|abdom|gut/i, area: "Abdomen" },
  { re: /chest|heart/i, area: "Chest" },
  { re: /throat|swallow/i, area: "Throat" },
  { re: /head|forehead|temple|migraine/i, area: "Head" },
  { re: /back|spine|lower back/i, area: "Back" },
  { re: /leg|knee|ankle|foot|feet|thigh/i, area: "Legs" },
  { re: /arm|shoulder|elbow|wrist|hand/i, area: "Arms" },
  { re: /skin|rash/i, area: "Skin" },
  { re: /cough/i, area: "Chest" },
];

function detectBodyArea(text: string): string | null {
  for (const { re, area } of BODY_MAP) if (re.test(text)) return area;
  return null;
}

const DURATIONS = ["Under 24h", "1–3 days", "4–7 days", "1–2 weeks", "Over 2 weeks"];

type Phase =
  | { kind: "main" }
  | { kind: "followup"; idx: number }
  | { kind: "duration" }
  | { kind: "severity" }
  | { kind: "additional" }
  | { kind: "thinking" }
  | { kind: "error" }
  | { kind: "done" };

const ADDITIONAL_CHIPS = ["Fever", "Chills", "Nausea", "Vomiting", "Dizziness", "Fatigue", "Rash", "None"];

const CHIP_SYNONYMS: Record<string, RegExp> = {
  Fever: /\bfever|temperature|hot\b/i,
  Chills: /\bchills?|shiver/i,
  Nausea: /\bnause|queasy|sick to (my|the) stomach\b/i,
  Vomiting: /\bvomit|puk(e|ing)|throw(ing)? up|threw up\b/i,
  Dizziness: /\bdizz|light[- ]?headed|vertigo\b/i,
  Fatigue: /\bfatigue|tired|exhaust|worn out\b/i,
  Rash: /\brash|hives|spots?\b/i,
};

function filterChips(context: string): string[] {
  return ADDITIONAL_CHIPS.filter((c) => {
    const re = CHIP_SYNONYMS[c];
    return !re || !re.test(context);
  });
}

const AI_TIMEOUT_MS = 25_000;

function Assess() {
  const nav = useNavigate();
  const { demo } = Route.useSearch();
  const call = useServerFn(runAssessment);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(true);
  const [phase, setPhase] = useState<Phase>({ kind: "main" });
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { assessmentStore.reset(); }, []);

  const say = (text: string) => {
    setTyping(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setMessages((m) => [...m, { id: `a-${Date.now()}-${Math.random()}`, role: "assistant", text }]);
        setTyping(false);
        taRef.current?.focus();
        resolve();
      }, 450);
    });
  };

  const bootedRef = useRef(false);
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    void say("Hi 👋 I'm Medi. Tell me what's been bothering you — describe it in your own words.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, phase]);

  const advance = async (next: Phase, ups: FollowUp[] = followUps) => {
    setPhase(next);
    if (next.kind === "followup") {
      const q = ups[next.idx];
      if (!q) { await advance({ kind: "duration" }, ups); return; }
      await say(q.prompt);
    } else if (next.kind === "duration") {
      await say("How long has this been going on?");
    } else if (next.kind === "severity") {
      await say("On a scale of 1 to 10, how bad does it feel right now?");
    } else if (next.kind === "additional") {
      await say("Anything else you've noticed? Tap any that apply, or say 'none'.");
    }
  };

  const runAi = async () => {
    const s = assessmentStore.get();
    const profile = loadProfile();
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timed out")), AI_TIMEOUT_MS),
    );
    return Promise.race([
      call({
        data: {
          mainSymptom: s.mainSymptom ?? "unspecified",
          bodyArea: s.bodyArea,
          duration: s.duration,
          severity: s.severity,
          additional: s.additional,
          followUps: s.followUpAnswers.map((a) => ({ prompt: a.prompt, answer: a.answer })),
          profile,
        },
      }),
      timeout,
    ]);
  };

  const finish = async () => {
    setPhase({ kind: "thinking" });
    const s = assessmentStore.get();

    const redFlag = detectRedFlag({
      mainSymptom: s.mainSymptom,
      severity: s.severity,
      additional: s.additional,
      answers: s.followUpAnswers,
    });
    if (redFlag) {
      assessmentStore.set({ redFlag });
      await say("I'm flagging this as urgent based on what you told me. Let me show you what to do next.");
      setPhase({ kind: "done" });
      return;
    }

    await say("Thanks — analysing your answers…");

    try {
      const result = await runAi();
      assessmentStore.set({ aiResult: result, aiError: null });
      await say(`Got it. Top possibility: ${result.conditions[0]?.name ?? "see results"}.`);
      setPhase({ kind: "done" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Assessment failed";
      assessmentStore.set({ aiError: msg });
      await say("I couldn't finish reasoning about this. You can retry, or continue with a basic assessment.");
      setPhase({ kind: "error" });
    }
  };

  const retryAi = async () => {
    setPhase({ kind: "thinking" });
    await say("Trying again…");
    try {
      const result = await runAi();
      assessmentStore.set({ aiResult: result, aiError: null });
      await say(`Got it. Top possibility: ${result.conditions[0]?.name ?? "see results"}.`);
      setPhase({ kind: "done" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Assessment failed";
      assessmentStore.set({ aiError: msg });
      await say("Still no luck. Continue with the basic assessment or try later.");
      setPhase({ kind: "error" });
    }
  };

  const handleFreeText = async (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text }]);
    setInput("");

    if (phase.kind === "main") {
      assessmentStore.set({
        mainSymptom: text.split(/[.,\n]/).map((s) => s.trim()).filter(Boolean).join(" — ").slice(0, 120) || text.slice(0, 120),
        bodyArea: detectBodyArea(text),
      });
      assessmentStore.addRawText(text);
      const s = assessmentStore.get();
      const ups = pickFollowUps(s.mainSymptom, s.bodyArea);
      setFollowUps(ups);
      await advance({ kind: "followup", idx: 0 }, ups);
      return;
    }

    if (phase.kind === "followup") {
      const q = followUps[phase.idx];
      assessmentStore.addFollowUp({ id: q.id, prompt: q.prompt, answer: text });
      const nextIdx = phase.idx + 1;
      if (nextIdx < followUps.length) await advance({ kind: "followup", idx: nextIdx });
      else await advance({ kind: "duration" });
      return;
    }

    if (phase.kind === "duration") {
      assessmentStore.set({ duration: text });
      await advance({ kind: "severity" });
      return;
    }
  };

  const handleSeverity = async (n: number) => {
    assessmentStore.set({ severity: n });
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text: `${n}/10` }]);
    await advance({ kind: "additional" });
  };

  const handleAdditional = async (chips: string[]) => {
    const list = chips.filter((c) => c !== "None");
    assessmentStore.set({ additional: list });
    setMessages((m) => [
      ...m,
      { id: `u-${Date.now()}`, role: "user", text: list.length ? list.join(", ") : "Nothing else" },
    ]);
    await finish();
  };

  const handleDuration = async (d: string) => {
    assessmentStore.set({ duration: d });
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text: d }]);
    await advance({ kind: "severity" });
  };

  const currentVoiceSample = useMemo(() => {
    if (phase.kind === "main") return "I've had a sore throat and a mild headache since yesterday";
    if (phase.kind === "followup") return followUps[phase.idx]?.voiceSample ?? "";
    if (phase.kind === "duration") return "About 2 days";
    return "";
  }, [phase, followUps]);

  const skip = () => currentVoiceSample && handleFreeText(currentVoiceSample);

  // Progress: only meaningful during structured question phases.
  const totalSteps = 1 + followUps.length + 3;
  const completedSteps =
    phase.kind === "main" ? 0 :
    phase.kind === "followup" ? 1 + phase.idx :
    phase.kind === "duration" ? 1 + followUps.length :
    phase.kind === "severity" ? 2 + followUps.length :
    phase.kind === "additional" ? 3 + followUps.length :
    totalSteps;
  const progress = (completedSteps / Math.max(totalSteps, 1)) * 100;
  const indeterminate = phase.kind === "thinking";

  const showTextInput = phase.kind === "main" || phase.kind === "followup";
  const showDurationChips = phase.kind === "duration";
  const showSeverity = phase.kind === "severity";
  const showAdditional = phase.kind === "additional";
  const showDone = phase.kind === "done";
  const showError = phase.kind === "error";
  const showThinking = phase.kind === "thinking";

  const subtitle =
    showDone ? "Summary" :
    showError ? "Something went wrong" :
    showThinking ? "Analysing…" :
    `Step ${Math.min(completedSteps + 1, totalSteps)} of ${totalSteps}`;

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        <ScreenHeader title="Symptom check" subtitle={subtitle} back="auto" backFallback="/home" />

        <div className="px-5 pt-3">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            {indeterminate ? (
              <div className="h-full w-1/3 animate-pulse gradient-primary" />
            ) : (
              <div className="h-full gradient-primary transition-all duration-500" style={{ width: `${progress}%` }} />
            )}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {messages.map((m) =>
            m.role === "assistant" ? <AssistantBubble key={m.id} text={m.text} /> : <UserBubble key={m.id} text={m.text} />,
          )}
          {typing && <TypingBubble />}

          {showDurationChips && !typing && (
            <div className="flex flex-wrap gap-2 pl-10">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => handleDuration(d)}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40 hover:bg-accent"
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          {showSeverity && !typing && <SeverityPicker onPick={handleSeverity} />}

          {showAdditional && !typing && (
            <AdditionalPicker
              onDone={handleAdditional}
              options={filterChips(
                [
                  assessmentStore.get().mainSymptom ?? "",
                  ...assessmentStore.get().rawTexts,
                  ...assessmentStore.get().followUpAnswers.map((a) => a.answer),
                ].join(" "),
              )}
            />
          )}

          {showError && (
            <div className="animate-fade-in-up space-y-2 pt-2">
              <button
                onClick={retryAi}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl gradient-primary text-sm font-semibold text-primary-foreground shadow-soft active:scale-[0.98]"
              >
                <RefreshCw className="h-4 w-4" /> Retry AI analysis
              </button>
              <button
                onClick={() => nav({ to: "/results" })}
                className="flex h-12 w-full items-center justify-center rounded-2xl border border-border bg-card text-sm font-semibold text-foreground"
              >
                Continue with basic assessment
              </button>
            </div>
          )}

          {showDone && (
            <div className="animate-fade-in-up pt-2">
              <button
                onClick={() => nav({ to: "/results" })}
                className="flex h-14 w-full items-center justify-center rounded-2xl gradient-primary text-base font-semibold text-primary-foreground shadow-soft active:scale-[0.98]"
              >
                View AI results
              </button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Medi provides guidance, not a diagnosis. In an emergency call your local emergency number.
              </p>
            </div>
          )}
        </div>

        {showTextInput && !showDone && !showThinking && !showError && (
          <div className="sticky bottom-0 border-t border-border/60 bg-background/90 px-3 pb-4 pt-3 backdrop-blur">
            <div className="flex items-end gap-2">
              <div className="flex flex-1 items-end rounded-3xl border border-border bg-card px-4 py-2 shadow-soft focus-within:border-primary/50">
                <textarea
                  ref={taRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleFreeText(input);
                    }
                  }}
                  placeholder="Type your reply…"
                  rows={1}
                  aria-label="Your reply"
                  className="max-h-28 flex-1 resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-muted-foreground"
                />
              </div>

              <button
                onClick={() => handleFreeText(input)}
                disabled={!input.trim()}
                aria-label="Send"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full gradient-primary text-primary-foreground shadow-soft transition disabled:opacity-40 active:scale-95"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            </div>

            {demo && currentVoiceSample && (
              <button
                onClick={skip}
                className="mx-auto mt-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="h-3 w-3" /> Use example answer
              </button>
            )}
          </div>
        )}

        <BottomNav />
      </div>
    </PhoneFrame>
  );
}

function SeverityPicker({ onPick }: { onPick: (n: number) => void }) {
  return (
    <div className="pl-10">
      <div role="radiogroup" aria-label="Severity 1 to 10" className="grid grid-cols-10 gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onPick(n)}
            role="radio"
            aria-checked={false}
            aria-label={`${n} out of 10`}
            className={`h-11 rounded-lg text-sm font-semibold transition ${
              n <= 3 ? "bg-success/15 text-success hover:bg-success/25" :
              n <= 6 ? "bg-warning/20 text-warning-foreground hover:bg-warning/30" :
              "bg-destructive/15 text-destructive hover:bg-destructive/25"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>Mild</span><span>Moderate</span><span>Severe</span>
      </div>
    </div>
  );
}

function AdditionalPicker({ onDone, options = ADDITIONAL_CHIPS }: { onDone: (chips: string[]) => void; options?: string[] }) {
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (c: string) => {
    if (c === "None") { setPicked(["None"]); return; }
    setPicked((p) => {
      const next = p.filter((x) => x !== "None");
      return next.includes(c) ? next.filter((x) => x !== c) : [...next, c];
    });
  };
  return (
    <div className="pl-10">
      <div className="flex flex-wrap gap-2">
        {options.map((c) => {
          const on = picked.includes(c);
          return (
            <button
              key={c}
              onClick={() => toggle(c)}
              className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onDone(picked.length ? picked : ["None"])}
        className="mt-3 h-11 rounded-2xl gradient-primary px-5 text-sm font-semibold text-primary-foreground shadow-soft"
      >
        Continue
      </button>
    </div>
  );
}

function AssistantBubble({ text }: { text: string }) {
  return (
    <div className="flex animate-fade-in-up items-start gap-2.5">
      <div className="mt-0.5 shrink-0"><Logo size={28} /></div>
      <div className="max-w-[78%] whitespace-pre-line pt-1 text-sm leading-6 text-foreground">{text}</div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex animate-fade-in-up justify-end">
      <div className="max-w-[78%] whitespace-pre-line rounded-3xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-6 text-primary-foreground shadow-soft">
        {text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 shrink-0"><Logo size={28} /></div>
      <div className="flex items-center gap-1 rounded-full bg-muted px-3.5 py-2.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70" />
      </div>
    </div>
  );
}
