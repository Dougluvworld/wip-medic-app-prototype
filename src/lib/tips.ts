import type { HealthProfile } from "./profile-store";

type Tip = { text: string; tags?: string[] };

const TIPS: Tip[] = [
  { text: "Aim for 7–9 hours of sleep. Poor sleep weakens your immune response." },
  { text: "Drink water first thing in the morning — mild dehydration causes headaches and fatigue." },
  { text: "A 10-minute walk after meals can improve blood-sugar control and digestion." },
  { text: "Wash hands for 20 seconds — the single most effective way to avoid infection." },
  { text: "Sit for less than 30 minutes at a time. Stand, stretch, walk — your back will thank you." },
  { text: "Sunlight in the first hour after waking helps regulate sleep the same night." },
  { text: "Slow, nasal breathing for 2 minutes drops your heart rate and stress hormones." },
  { text: "Two servings of vegetables at lunch keeps energy steadier than a heavy carb-only meal." },
  { text: "asthma", tags: ["asthma"] },
  { text: "diabetes", tags: ["diabetes"] },
  { text: "hypertension", tags: ["hypertension", "blood pressure"] },
  { text: "allergies", tags: ["allergies"] },
];

const TAGGED: Record<string, string> = {
  asthma: "Keep your reliever inhaler within reach — cold air and pollen can trigger symptoms unexpectedly.",
  diabetes: "Check blood glucose consistently at the same times each day to spot patterns early.",
  "blood pressure": "Limit salt to under 5g/day and keep alcohol modest to protect blood pressure.",
  hypertension: "Limit salt to under 5g/day and keep alcohol modest to protect blood pressure.",
  allergies: "High-pollen days: shower after coming inside and rinse eyes to reduce lingering exposure.",
  penicillin: "Always mention your penicillin allergy at every pharmacy and clinic visit — even for a small prescription.",
};

function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

export function dailyTip(profile: HealthProfile | null): string {
  const hay = [
    ...(profile?.conditions ?? []),
    ...(profile?.allergies ?? []),
    ...(profile?.medications ?? []),
  ]
    .join(" ")
    .toLowerCase();

  // Prefer a personalised tip 50% of the time when we have a match.
  const matches = Object.keys(TAGGED).filter((k) => hay.includes(k));
  const useTagged = matches.length > 0 && dayOfYear() % 2 === 0;
  if (useTagged) {
    return TAGGED[matches[dayOfYear() % matches.length]];
  }
  const generic = TIPS.filter((t) => !t.tags);
  return generic[dayOfYear() % generic.length].text;
}
