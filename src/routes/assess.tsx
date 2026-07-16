import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Logo } from "@/components/ScreenHeader";
import { assessmentStore } from "@/lib/assessment-store";
import { ArrowUp, Mic, SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/assess")({
  head: () => ({
    meta: [
      { title: "Symptom Check — Medi-Care" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Assess,
});

type Msg = { id: string; role: "assistant" | "user"; text: string };

type FieldKey = "mainSymptom" | "bodyArea" | "duration" | "severity" | "additional";

type Step = {
  key: FieldKey;
  prompt: (state: ReturnType<typeof assessmentStore.get>) => string;
  apply: (raw: string) => void;
  voiceSample: string;
};

// Map keywords in free-text to a canonical body area
const BODY_MAP: Array<{ re: RegExp; area: string }> = [
  { re: /stomach|belly|tummy|abdom|gut/i, area: "Abdomen" },
  { re: /chest|heart/i, area: "Chest" },
  { re: /throat|swallow/i, area: "Throat" },
  { re: /head|forehead|temple|migraine/i, area: "Head" },
  { re: /back|spine|lower back/i, area: "Back" },
  { re: /leg|knee|ankle|foot|feet|thigh/i, area: "Legs" },
  { re: /arm|shoulder|elbow|wrist|hand/i, area: "Arms" },
  { re: /skin|rash/i, area: "Skin" },
  { re: /ear/i, area: "Ear" },
  { re: /eye|vision/i, area: "Eye" },
];

const DURATION_RES: RegExp[] = [
  /\b(?:since|for)\s+(?:the\s+)?(?:last\s+)?([a-z0-9\-\s]+?)(?=[.,]|$)/i,
  /\b(a\s+few|several|couple of|about)?\s*\d+\s*(?:hour|hr|day|week|month|year)s?\s*(?:now|ago)?/i,
  /\b(yesterday|today|this morning|last night|last week)\b/i,
];

function detectBodyArea(text: string): string | null {
  for (const { re, area } of BODY_MAP) if (re.test(text)) return area;
  return null;
}

function detectDuration(text: string): string | null {
  for (const re of DURATION_RES) {
    const m = text.match(re);
    if (m) return m[0].replace(/^\s*(since|for)\s+/i, "").trim();
  }
  return null;
}

function detectSeverity(text: string): number | null {
  const m = text.match(/\b(\d{1,2})\s*(?:\/|out of)\s*10\b/i) || text.match(/\b(?:around|about)?\s*(\d{1,2})\b/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (isNaN(n) || n < 1 || n > 10) return null;
  return n;
}

// Run every free-text answer through here to opportunistically fill later fields
function autofill(text: string) {
  const s = assessmentStore.get();
  const patch: Partial<ReturnType<typeof assessmentStore.get>> = {};
  if (!s.bodyArea) {
    const area = detectBodyArea(text);
    if (area) patch.bodyArea = area;
  }
  if (!s.duration) {
    const dur = detectDuration(text);
    if (dur) patch.duration = dur;
  }
  if (Object.keys(patch).length) assessmentStore.set(patch);
}

const steps: Step[] = [
  {
    key: "mainSymptom",
    prompt: () => "Hi 👋 I'm Medi. Tell me what's been bothering you — describe it in your own words.",
    apply: (raw) => {
      assessmentStore.set({
        mainSymptom: raw.split(/[.,\n]/)[0].slice(0, 60).trim() || raw.slice(0, 60),
      });
      autofill(raw);
    },
    voiceSample: "I've had a sore throat and a mild headache since yesterday",
  },
  {
    key: "bodyArea",
    prompt: () => "Thanks. Where in your body are you feeling this most?",
    apply: (raw) => {
      const detected = detectBodyArea(raw) ?? raw.slice(0, 40).trim();
      assessmentStore.set({ bodyArea: detected });
      autofill(raw);
    },
    voiceSample: "Mostly in my throat and forehead",
  },
  {
    key: "duration",
    prompt: () => "How long has this been going on?",
    apply: (raw) => {
      const d = detectDuration(raw) ?? raw.slice(0, 40).trim();
      assessmentStore.set({ duration: d });
    },
    voiceSample: "About 2 days now",
  },
  {
    key: "severity",
    prompt: () => "On a scale of 1 to 10, how bad does it feel right now?",
    apply: (raw) => {
      const n = detectSeverity(raw);
      assessmentStore.set({ severity: n ?? 5 });
    },
    voiceSample: "I'd say around a 6",
  },
  {
    key: "additional",
    prompt: () =>
      "Last one — anything else you've noticed? Fever, nausea, fatigue, chills… or say 'nothing'.",
    apply: (raw) => {
      const list = raw
        .toLowerCase()
        .split(/,| and |\n/)
        .map((s) => s.trim())
        .filter((s) => s && s !== "nothing" && s !== "no" && s !== "none" && s.length < 30)
        .map((s) => s[0].toUpperCase() + s.slice(1));
      assessmentStore.set({ additional: list.slice(0, 6) });
    },
    voiceSample: "A bit of fever and fatigue",
  },
];

function isAnswered(key: FieldKey, s: ReturnType<typeof assessmentStore.get>): boolean {
  switch (key) {
    case "mainSymptom": return !!s.mainSymptom;
    case "bodyArea": return !!s.bodyArea;
    case "duration": return !!s.duration;
    // severity has a default (4) — always ask; additional is optional but always ask once
    default: return false;
  }
}

function nextUnansweredIdx(from: number): number {
  const s = assessmentStore.get();
  for (let i = from; i < steps.length; i++) {
    if (!isAnswered(steps[i].key, s)) return i;
  }
  return steps.length;
}

function Assess() {
  const nav = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(true);
  const [listening, setListening] = useState(false);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Reset store when entering the flow fresh
  useEffect(() => {
    assessmentStore.reset();
  }, []);

  // Post the assistant prompt for the current step
  useEffect(() => {
    if (stepIdx >= steps.length) return;
    setTyping(true);
    const t = setTimeout(() => {
      const s = assessmentStore.get();
      setMessages((m) => [
        ...m,
        { id: `a-${stepIdx}-${Date.now()}`, role: "assistant", text: steps[stepIdx].prompt(s) },
      ]);
      setTyping(false);
      taRef.current?.focus();
    }, 650);
    return () => clearTimeout(t);
  }, [stepIdx]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, done]);

  const finish = () => {
    setTyping(true);
    setTimeout(() => {
      const a = assessmentStore.get();
      const recap = `Here's what I've got:\n\n• Symptom: ${a.mainSymptom ?? "—"}\n• Area: ${a.bodyArea ?? "—"}\n• Duration: ${a.duration ?? "—"}\n• Severity: ${a.severity}/10${
        a.additional.length ? `\n• Other: ${a.additional.join(", ")}` : ""
      }\n\nReady to see what this might mean?`;
      setMessages((m) => [...m, { id: `a-recap-${Date.now()}`, role: "assistant", text: recap }]);
      setTyping(false);
      setDone(true);
    }, 700);
  };

  const submit = (raw: string) => {
    const text = raw.trim();
    if (!text || done) return;
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text }]);
    steps[stepIdx].apply(text);
    setInput("");

    // Auto-filled fields (body area, duration) are captured silently —
    // skip straight to the next unanswered question without echoing them back.
    const nextIdx = nextUnansweredIdx(stepIdx + 1);

    if (nextIdx >= steps.length) {
      finish();
    } else {
      setStepIdx(nextIdx);
    }
  };

  const skip = () => {
    if (done) return;
    submit(steps[stepIdx].voiceSample);
  };

  const startMockListen = () => {
    if (done) return;
    setListening(true);
    setTimeout(() => {
      setInput(steps[stepIdx].voiceSample);
      setListening(false);

      taRef.current?.focus();
    }, 1400);
  };

  const progress = done ? 100 : ((stepIdx) / steps.length) * 100;

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        <ScreenHeader
          title="Symptom check"
          subtitle={done ? "Summary" : `Question ${Math.min(stepIdx + 1, steps.length)} of ${steps.length}`}
          back="/home"
        />

        <div className="px-5 pt-3">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full gradient-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Chat scroll area */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {messages.map((m) =>
            m.role === "assistant" ? (
              <AssistantBubble key={m.id} text={m.text} />
            ) : (
              <UserBubble key={m.id} text={m.text} />
            ),
          )}
          {typing && <TypingBubble />}

          {done && (
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

        {/* Composer */}
        {!done && (
          <div className="sticky bottom-0 border-t border-border/60 bg-background/90 px-3 pb-4 pt-3 backdrop-blur">
            <div className="flex items-end gap-2">
              <button
                onClick={startMockListen}
                aria-label="Voice input (demo)"
                className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full border transition ${
                  listening
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                {listening && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
                )}
                <Mic className="relative h-5 w-5" />
              </button>

              <div className="flex flex-1 items-end rounded-3xl border border-border bg-card px-4 py-2 shadow-soft focus-within:border-primary/50">
                <textarea
                  ref={taRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submit(input);
                    }
                  }}
                  placeholder={listening ? "Listening…" : "Type your reply…"}
                  rows={1}
                  className="max-h-28 flex-1 resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-muted-foreground"
                />
              </div>

              <button
                onClick={() => submit(input)}
                disabled={!input.trim()}
                aria-label="Send"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full gradient-primary text-primary-foreground shadow-soft transition disabled:opacity-40 active:scale-95"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={skip}
              className="mx-auto mt-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              <SkipForward className="h-3 w-3" />
              Use example answer
            </button>
          </div>
        )}

        <BottomNav />
      </div>
    </PhoneFrame>
  );
}

function AssistantBubble({ text }: { text: string }) {
  return (
    <div className="flex animate-fade-in-up items-start gap-2.5">
      <div className="mt-0.5 shrink-0">
        <Logo size={28} />
      </div>
      <div className="max-w-[78%] whitespace-pre-line pt-1 text-sm leading-6 text-foreground">
        {text}
      </div>
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
      <div className="mt-0.5 shrink-0">
        <Logo size={28} />
      </div>
      <div className="flex items-center gap-1 rounded-full bg-muted px-3.5 py-2.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70" />
      </div>
    </div>
  );
}
