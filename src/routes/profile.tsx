import { createFileRoute } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Check, Phone, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { loadProfile, saveProfile, type EmergencyContact } from "@/lib/profile-store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: "Medical Profile — Medi-Care" }, { name: "robots", content: "noindex" }],
  }),
  component: Profile,
});

function Profile() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Non-binary");
  const [bloodType, setBloodType] = useState("");
  const [gpName, setGpName] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [meds, setMeds] = useState<string[]>([]);
  const [emergency, setEmergency] = useState<EmergencyContact>({});
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const p = loadProfile();
    setName(p.name ?? "");
    setAge(p.age ?? "");
    setGender(p.gender ?? "Non-binary");
    setBloodType(p.bloodType ?? "");
    setGpName(p.gpName ?? "");
    setAllergies(p.allergies ?? []);
    setConditions(p.conditions ?? []);
    setMeds(p.medications ?? []);
    setEmergency(p.emergencyContact ?? {});
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveProfile({ name, age, gender, bloodType, gpName, conditions, medications: meds, allergies, emergencyContact: emergency });
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1500);
  }, [ready, name, age, gender, bloodType, gpName, conditions, meds, allergies, emergency]);

  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        <ScreenHeader
          title="Medical profile"
          back="auto"
          backFallback="/home"
          right={
            <span
              aria-live="polite"
              className={`flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success transition-opacity ${
                saved ? "opacity-100" : "opacity-0"
              }`}
            >
              <Check className="h-3 w-3" /> Saved
            </span>
          }
        />

        <div className="flex-1 space-y-5 px-5 py-5">
          {/* Avatar block */}
          <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4 shadow-card">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl gradient-primary text-2xl font-semibold text-primary-foreground shadow-soft">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-xl font-semibold">{name || "Your name"}</p>
              <p className="text-xs text-muted-foreground">
                {[age && `${age} years`, gender, bloodType].filter(Boolean).join(" · ") || "Fill in your details below"}
              </p>
            </div>
          </div>

          {/* Basic info */}
          <Section title="Basic information">
            <Field label="Full name" value={name} onChange={setName} placeholder="Alex Morgan" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Age" value={age} onChange={setAge} placeholder="29" />
              <SelectField label="Gender" value={gender} onChange={setGender}
                options={["Female", "Male", "Non-binary", "Prefer not to say"]} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Blood type" value={bloodType} onChange={setBloodType}
                options={["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"]} />
              <Field label="GP / doctor" value={gpName} onChange={setGpName} placeholder="Dr. Chen" />
            </div>
          </Section>

          <Section title="Allergies">
            <TagEditor items={allergies} setItems={setAllergies} placeholder="e.g. Penicillin" tone="destructive" />
          </Section>

          <Section title="Existing conditions">
            <TagEditor items={conditions} setItems={setConditions} placeholder="e.g. Asthma" tone="primary" />
          </Section>

          <Section title="Current medications">
            <TagEditor items={meds} setItems={setMeds} placeholder="e.g. Salbutamol" tone="secondary" />
          </Section>

          <Section title="Emergency contact">
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    Who should we contact if there's an emergency?
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InlineInput label="Name" value={emergency.name ?? ""} onChange={(v) => setEmergency({ ...emergency, name: v })} placeholder="Sam Morgan" />
                <InlineInput label="Relationship" value={emergency.relationship ?? ""} onChange={(v) => setEmergency({ ...emergency, relationship: v })} placeholder="Partner" />
              </div>
              <InlineInput label="Phone" value={emergency.phone ?? ""} onChange={(v) => setEmergency({ ...emergency, phone: v })} placeholder="+44 7700 900 123" type="tel" />
            </div>
          </Section>

          <p className="pt-2 text-center text-xs text-muted-foreground">
            Your medical data is stored on this device and never sold.
          </p>
        </div>

        <BottomNav />
      </div>
    </PhoneFrame>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block rounded-2xl border border-border bg-card px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-0.5 block w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}

function InlineInput({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="mt-0.5 w-full rounded-xl bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block rounded-2xl border border-border bg-card px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 block w-full bg-transparent text-sm font-medium text-foreground outline-none"
      >
        {options.map((o) => <option key={o} value={o}>{o || "—"}</option>)}
      </select>
    </label>
  );
}

function TagEditor({ items, setItems, placeholder, tone }: { items: string[]; setItems: (v: string[]) => void; placeholder: string; tone: "primary" | "secondary" | "destructive" }) {
  const [input, setInput] = useState("");
  const toneClass = {
    primary: "bg-accent text-primary",
    secondary: "bg-secondary/15 text-secondary",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];
  const add = () => {
    const t = input.trim();
    if (!t) return;
    if (items.includes(t)) { setInput(""); return; }
    setItems([...items, t]);
    setInput("");
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex flex-wrap gap-2">
        {items.map((it) => (
          <span key={it} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${toneClass}`}>
            {it}
            <button
              onClick={() => setItems(items.filter((x) => x !== it))}
              className="opacity-60 hover:opacity-100"
              aria-label={`Remove ${it}`}
            >
              ×
            </button>
          </span>
        ))}
        {items.length === 0 && <span className="text-xs text-muted-foreground">None added</span>}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 rounded-xl bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={add}
          aria-label="Add"
          className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-soft"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
