import { createFileRoute } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Phone, Pencil, Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: "Medical Profile — Medi-Care" }, { name: "robots", content: "noindex" }],
  }),
  component: Profile,
});

function Profile() {
  const [allergies, setAllergies] = useState(["Penicillin", "Peanuts"]);
  const [conditions, setConditions] = useState(["Asthma"]);
  const [meds, setMeds] = useState(["Salbutamol inhaler"]);
  const [name, setName] = useState("Alex Morgan");
  const [age, setAge] = useState("29");
  const [gender, setGender] = useState("Non-binary");

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        <ScreenHeader title="Medical profile" back="/home" right={
          <button className="grid h-10 w-10 place-items-center rounded-full bg-muted text-foreground hover:bg-accent">
            <Pencil className="h-4 w-4" />
          </button>
        } />

        <div className="flex-1 space-y-5 px-5 py-5">
          {/* Avatar block */}
          <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4 shadow-card">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl gradient-primary text-2xl font-semibold text-primary-foreground shadow-soft">
              {name.split(" ").map((s) => s[0]).join("").slice(0,2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-xl font-semibold">{name}</p>
              <p className="text-xs text-muted-foreground">{age} years · {gender}</p>
            </div>
          </div>

          {/* Basic info */}
          <Section title="Basic information">
            <Field label="Full name" value={name} onChange={setName} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Age" value={age} onChange={setAge} />
              <SelectField label="Gender" value={gender} onChange={setGender}
                options={["Female", "Male", "Non-binary", "Prefer not to say"]} />
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
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                <Phone className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">Sam Morgan</p>
                <p className="text-xs text-muted-foreground">Partner · +44 7700 900 123</p>
              </div>
              <button className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                Edit
              </button>
            </div>
          </Section>

          <p className="pt-2 text-center text-xs text-muted-foreground">
            Your medical data is encrypted and never sold.
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

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block rounded-2xl border border-border bg-card px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 block w-full bg-transparent text-sm font-medium text-foreground outline-none"
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
        {options.map((o) => <option key={o}>{o}</option>)}
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
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex flex-wrap gap-2">
        {items.map((it) => (
          <span key={it} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${toneClass}`}>
            {it}
            <button onClick={() => setItems(items.filter((x) => x !== it))} className="opacity-60 hover:opacity-100">×</button>
          </span>
        ))}
        {items.length === 0 && <span className="text-xs text-muted-foreground">None added</span>}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              setItems([...items, input.trim()]);
              setInput("");
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-xl bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={() => { if (input.trim()) { setItems([...items, input.trim()]); setInput(""); } }}
          className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-soft"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
