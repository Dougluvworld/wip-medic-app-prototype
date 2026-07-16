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

type Step = {
  prompt: string;
  apply: (raw: string) => void;
  voiceSample: string;
};

const steps: Step[] = [
  {
    prompt:
      "Hi 👋 I'm Medi. Tell me what's been bothering you — describe it in your own words.",
    apply: (raw) =>
      assessmentStore.set({ mainSymptom: raw.split(/[.,\n]/)[0].slice(0, 60).trim() || raw.slice(0, 60) }),
    voiceSample: "I've had a sore throat and a mild headache since yesterday",
  },
  {
    prompt: "Thanks for sharing. Where in your body are you feeling this most?",
    apply: (raw) => assessmentStore.set({ bodyArea: raw.slice(0, 40).trim() }),
    voiceSample: "Mostly in my throat and forehead",
  },
  {
    prompt: "Got it. How long has this been going on?",
    apply: (raw) => assessmentStore.set({ duration: raw.slice(0, 40).trim() }),
    voiceSample: "About 2 days now",
  },
  {
    prompt: "On a scale of 1 to 10, how bad does it feel right now?",
    apply: (raw) => {
      const n = parseInt(raw.replace(/[^0-9]/g, ""), 10);
      assessmentStore.set({ severity: Math.min(10, Math.max(1, isNaN(n) ? 5 : n)) });
    },
    voiceSample: "I'd say around a 6",
  },
  {
    prompt:
      "Last one — anything else you've noticed? Fever, nausea, fatigue, chills… or nothing else.",
    apply: (raw) => {
      const list = raw
        .toLowerCase()
        .split(/,| and |\n/)
        .map((s) => s.trim())
        .filter((s) => s && s !== "nothing" && s !== "no" && s.length < 30)
        .map((s) => s[0].toUpperCase() + s.slice(1));
      assessmentStore.set({ additional: list.slice(0, 6) });
    },
    voiceSample: "A bit of fever and fatigue",
  },
];

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
      setMessages((m) => [
        ...m,
        { id: `a-${stepIdx}-${Date.now()}`, role: "assistant", text: steps[stepIdx].prompt },
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

  const submit = (raw: string) => {
    const text = raw.trim();
    if (!text || done) return;
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text }]);
    steps[stepIdx].apply(text);
    setInput("");

    if (stepIdx + 1 >= steps.length) {
      // Show recap
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
    } else {
      setStepIdx((i) => i + 1);
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
                Medi provides guidance, not a diagnosis. In an emergency call 999.
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
