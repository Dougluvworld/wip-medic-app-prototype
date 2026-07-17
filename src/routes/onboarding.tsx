import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { PhoneFrame } from "@/components/PhoneFrame";
import {
  ArrowRight,
  ContactRound,
  HeartPulse,
  Plus,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { loadProfile, markOnboarded, saveProfile } from "@/lib/profile-store";
import { contactPickerSupported, pickContact } from "@/lib/contact-picker";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Welcome — Medi-Care" }, { name: "robots", content: "noindex" }],
  }),
  component: Onboarding,
});

const TOTAL = 3;

const ALLERGY_PRESETS = ["Penicillin", "Peanuts", "Latex", "Shellfish", "Ibuprofen", "None"];
const SEX_OPTIONS = ["Female", "Male", "Other", "Prefer not to say"] as const;
const RELATIONSHIPS = ["Partner", "Parent", "Sibling", "Friend", "Other"] as const;

const nameSchema = z.string().trim().max(60, "Keep it under 60 characters");
const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+\d\s\-()]{5,20}$/, "Enter a valid phone number");
const allergySchema = z.string().trim().min(1).max(40);

function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);

  // Form state
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState<string>("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [relationship, setRelationship] = useState("");

  // Hydrate from any pre-existing profile so returning users don't lose data.
  useEffect(() => {
    const p = loadProfile();
    if (p.name) setName(p.name);
    if (p.dob) setDob(p.dob);
    if (p.gender) setSex(p.gender);
    if (p.allergies?.length) setAllergies(p.allergies);
    if (p.emergencyContact?.name) setContactName(p.emergencyContact.name);
    if (p.emergencyContact?.phone) setContactPhone(p.emergencyContact.phone);
    if (p.emergencyContact?.relationship) setRelationship(p.emergencyContact.relationship);
  }, []);

  const persistAndFinish = () => {
    // Validate the two typed fields that could contain garbage; everything else is presets.
    if (name && !nameSchema.safeParse(name).success) {
      toast.error("Name is too long");
      setStep(0);
      return;
    }
    if (contactPhone && !phoneSchema.safeParse(contactPhone).success) {
      toast.error("Enter a valid emergency phone number");
      setStep(2);
      return;
    }

    const trimmedAllergies = allergies
      .map((a) => a.trim())
      .filter((a) => a && allergySchema.safeParse(a).success)
      .slice(0, 10);

    const current = loadProfile();
    saveProfile({
      ...current,
      name: name.trim(),
      dob: dob || "",
      gender: sex || "",
      allergies: trimmedAllergies,
      emergencyContact: {
        name: contactName.trim(),
        phone: contactPhone.trim(),
        relationship: relationship || "",
      },
    });
    markOnboarded();
    nav({ to: "/home" });
  };

  const skipAll = () => {
    markOnboarded();
    nav({ to: "/home" });
  };

  const next = () => {
    if (step < TOTAL - 1) setStep(step + 1);
    else persistAndFinish();
  };

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col px-6 pt-[calc(env(safe-area-inset-top)+20px)]">
        {/* Progress + skip */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step + 1}>
            {Array.from({ length: TOTAL }).map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === step ? "w-8 bg-primary" : idx < step ? "w-4 bg-primary/50" : "w-4 bg-border"
                }`}
              />
            ))}
          </div>
          <button
            onClick={skipAll}
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            Skip
          </button>
        </div>

        {/* Step body */}
        <div key={step} className="flex flex-1 flex-col animate-fade-in-up">
          {step === 0 && <StepName name={name} setName={setName} />}
          {step === 1 && (
            <StepVitals
              dob={dob}
              setDob={setDob}
              sex={sex}
              setSex={setSex}
              allergies={allergies}
              setAllergies={setAllergies}
            />
          )}
          {step === 2 && (
            <StepContact
              contactName={contactName}
              setContactName={setContactName}
              contactPhone={contactPhone}
              setContactPhone={setContactPhone}
              relationship={relationship}
              setRelationship={setRelationship}
            />
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3 pb-10">
          <button
            onClick={next}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl gradient-primary text-base font-semibold text-primary-foreground shadow-soft transition-transform active:scale-[0.98]"
          >
            {step === TOTAL - 1 ? "Finish" : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </button>
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex h-11 w-full items-center justify-center text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Back
            </button>
          ) : (
            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              Every step is optional. You can complete this later in your profile.
            </p>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}

/* --------------------------- Step 1: Name --------------------------- */

function StepName({ name, setName }: { name: string; setName: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // Small delay so the fade-in doesn't fight the mobile keyboard.
    const t = setTimeout(() => ref.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-float">
        <UserRound className="h-8 w-8" strokeWidth={1.7} />
      </div>
      <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight">
        What should we call you?
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
        Just a first name is fine — it personalises your assessments.
      </p>
      <input
        ref={ref}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        autoComplete="given-name"
        maxLength={60}
        className="mt-8 h-14 w-full rounded-2xl border border-border bg-card px-4 text-base font-medium outline-none transition-colors focus:border-primary"
      />
    </div>
  );
}

/* --------------------------- Step 2: Vitals --------------------------- */

function StepVitals({
  dob,
  setDob,
  sex,
  setSex,
  allergies,
  setAllergies,
}: {
  dob: string;
  setDob: (v: string) => void;
  sex: string;
  setSex: (v: string) => void;
  allergies: string[];
  setAllergies: (v: string[]) => void;
}) {
  const [custom, setCustom] = useState("");

  const toggle = (a: string) => {
    if (a === "None") {
      setAllergies(allergies.includes("None") ? [] : ["None"]);
      return;
    }
    const without = allergies.filter((x) => x !== "None");
    setAllergies(
      without.includes(a) ? without.filter((x) => x !== a) : [...without, a].slice(0, 10),
    );
  };

  const addCustom = () => {
    const v = custom.trim();
    if (!v || allergies.includes(v) || allergies.length >= 10) {
      setCustom("");
      return;
    }
    setAllergies([...allergies.filter((x) => x !== "None"), v]);
    setCustom("");
  };

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  return (
    <div className="flex flex-1 flex-col justify-start pt-6">
      <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-float">
        <HeartPulse className="h-8 w-8" strokeWidth={1.7} />
      </div>
      <h2 className="font-display text-[26px] font-semibold leading-tight tracking-tight">
        A few vitals
      </h2>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
        Optional — but they make triage far more accurate.
      </p>

      <div className="mt-5 space-y-5">
        {/* DOB */}
        <div>
          <label htmlFor="dob" className="mb-1.5 block text-xs font-semibold text-foreground">
            Date of birth
          </label>
          <input
            id="dob"
            type="date"
            value={dob}
            max={today}
            onChange={(e) => setDob(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm font-medium outline-none focus:border-primary"
          />
        </div>

        {/* Sex */}
        <div>
          <p className="mb-1.5 text-xs font-semibold text-foreground">Biological sex</p>
          <div className="grid grid-cols-2 gap-2">
            {SEX_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setSex(sex === opt ? "" : opt)}
                className={`h-11 rounded-xl border px-3 text-sm font-medium transition-colors ${
                  sex === opt
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div>
          <p className="mb-1.5 text-xs font-semibold text-foreground">Known allergies</p>
          <div className="flex flex-wrap gap-2">
            {ALLERGY_PRESETS.map((a) => {
              const active = allergies.includes(a);
              return (
                <button
                  key={a}
                  onClick={() => toggle(a)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  {a}
                </button>
              );
            })}
            {allergies
              .filter((a) => !ALLERGY_PRESETS.includes(a))
              .map((a) => (
                <button
                  key={a}
                  onClick={() => setAllergies(allergies.filter((x) => x !== a))}
                  className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                >
                  {a}
                  <X className="h-3 w-3" />
                </button>
              ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
              maxLength={40}
              placeholder="Add another"
              className="h-10 flex-1 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={addCustom}
              className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-primary hover:border-primary/40"
              aria-label="Add allergy"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Step 3: Emergency contact --------------------------- */

function StepContact({
  contactName,
  setContactName,
  contactPhone,
  setContactPhone,
  relationship,
  setRelationship,
}: {
  contactName: string;
  setContactName: (v: string) => void;
  contactPhone: string;
  setContactPhone: (v: string) => void;
  relationship: string;
  setRelationship: (v: string) => void;
}) {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    setSupported(contactPickerSupported());
  }, []);

  const runPicker = async () => {
    const result = await pickContact();
    if (!result) {
      toast.error("Couldn't read contact — try typing it below");
      return;
    }
    if (result.name) setContactName(result.name);
    if (result.phone) setContactPhone(result.phone);
    toast.success("Contact added");
  };

  return (
    <div className="flex flex-1 flex-col justify-start pt-6">
      <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-float">
        <ContactRound className="h-8 w-8" strokeWidth={1.7} />
      </div>
      <h2 className="font-display text-[26px] font-semibold leading-tight tracking-tight">
        Emergency contact
      </h2>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
        We'll show a one-tap call button when an assessment flags anything serious.
      </p>

      {supported && (
        <button
          onClick={runPicker}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/5 text-sm font-semibold text-primary hover:bg-primary/10"
        >
          <Sparkles className="h-4 w-4" /> Pick from contacts
        </button>
      )}

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="ec-name" className="mb-1.5 block text-xs font-semibold">
            Name
          </label>
          <input
            id="ec-name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            autoComplete="name"
            maxLength={60}
            placeholder="e.g. Sam"
            className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm font-medium outline-none focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="ec-phone" className="mb-1.5 block text-xs font-semibold">
            Phone
          </label>
          <input
            id="ec-phone"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            autoComplete="tel"
            inputMode="tel"
            maxLength={20}
            placeholder="+44 7…"
            className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm font-medium outline-none focus:border-primary"
          />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold">Relationship</p>
          <div className="flex flex-wrap gap-2">
            {RELATIONSHIPS.map((r) => (
              <button
                key={r}
                onClick={() => setRelationship(relationship === r ? "" : r)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  relationship === r
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-2 rounded-xl bg-accent/60 p-3">
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Stored only on this device. You can remove it any time in Profile.
        </p>
      </div>
    </div>
  );
}
