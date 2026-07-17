// Adaptive follow-up questions per main symptom + red-flag rules.

export type FollowUp = {
  id: string;
  prompt: string;
  voiceSample: string;
  skipIf?: RegExp;
};


export type FollowUpAnswer = { id: string; prompt: string; answer: string };

const FOLLOWUPS: Record<string, FollowUp[]> = {
  chest: [
    { id: "chest-breath", prompt: "Does the pain change when you breathe deeply or move?", voiceSample: "It gets sharper when I breathe in" },
    { id: "chest-radiate", prompt: "Is the pain spreading to your arm, jaw, neck, or back?", voiceSample: "No, it stays in the chest" },
    { id: "chest-sob", prompt: "Are you feeling short of breath, sweaty, or dizzy with it?", voiceSample: "A little short of breath" },
  ],
  head: [
    { id: "head-onset", prompt: "Did it come on suddenly — like a thunderclap — or build gradually?", voiceSample: "It built up over a few hours" },
    { id: "head-neuro", prompt: "Any vision changes, weakness on one side, or confusion?", voiceSample: "No, nothing like that" },
    { id: "head-neck", prompt: "Any neck stiffness, fever, or sensitivity to light?", voiceSample: "Bit of light sensitivity" },
  ],
  abdomen: [
    { id: "abd-where", prompt: "Where exactly does it hurt — upper, lower, one side?", voiceSample: "Lower right side", skipIf: /\b(upper|lower|left|right|middle|centre|center|one[- ]sided|side)\b/i },
    { id: "abd-assoc", prompt: "Any vomiting, blood, or fever with it?", voiceSample: "Some nausea, no blood" },
  ],

  throat: [
    { id: "throat-swallow", prompt: "Is it painful to swallow, or is your voice affected?", voiceSample: "Painful to swallow" },
    { id: "throat-fever", prompt: "Any fever, swollen glands, or white patches at the back of the throat?", voiceSample: "Mild fever" },
  ],
  back: [
    { id: "back-radiate", prompt: "Does the pain shoot down into your legs or buttocks?", voiceSample: "It goes into my right leg" },
    { id: "back-numb", prompt: "Any numbness, weakness, or loss of bladder/bowel control?", voiceSample: "No numbness" },
  ],
  skin: [
    { id: "rash-spread", prompt: "Is it spreading, painful, or itchy?", voiceSample: "Very itchy and spreading" },
    { id: "rash-swelling", prompt: "Any swelling of your face, lips, or tongue, or trouble breathing?", voiceSample: "No swelling" },
  ],
  cough: [
    { id: "cough-sputum", prompt: "Are you coughing anything up? What colour?", voiceSample: "Yellow mucus" },
    { id: "cough-breath", prompt: "Any wheezing, chest tightness, or shortness of breath?", voiceSample: "A bit of wheezing" },
  ],
  generic: [
    { id: "gen-worse", prompt: "Is it getting better, worse, or staying about the same?", voiceSample: "Slowly getting worse" },
    { id: "gen-tried", prompt: "Have you tried anything for it so far?", voiceSample: "Paracetamol, didn't help much" },
  ],
};

const AREA_ALIASES: Record<string, string> = {
  chest: "chest",
  heart: "chest",
  head: "head",
  headache: "head",
  migraine: "head",
  abdomen: "abdomen",
  stomach: "abdomen",
  belly: "abdomen",
  tummy: "abdomen",
  throat: "throat",
  back: "back",
  spine: "back",
  skin: "skin",
  rash: "skin",
  cough: "cough",
};

export function pickFollowUps(mainSymptom: string | null, bodyArea: string | null): FollowUp[] {
  const hay = `${mainSymptom ?? ""} ${bodyArea ?? ""}`.toLowerCase();
  for (const [key, group] of Object.entries(AREA_ALIASES)) {
    if (hay.includes(key)) return FOLLOWUPS[group];
  }
  return FOLLOWUPS.generic;
}

// Red-flag rules. Return the first triggered reason.
export function detectRedFlag(input: {
  mainSymptom: string | null;
  severity: number;
  additional: string[];
  answers: FollowUpAnswer[];
}): string | null {
  const parts = [
    input.mainSymptom ?? "",
    input.additional.join(" "),
    input.answers.map((a) => a.answer).join(" "),
  ]
    .join(" ")
    .toLowerCase();

  const rules: Array<{ test: () => boolean; reason: string }> = [
    {
      test: () => /chest/.test(parts) && /(short(ness)? of breath|can'?t breathe|sweat|radiat|arm|jaw)/.test(parts),
      reason: "Chest pain with breathing difficulty or pain spreading to arm/jaw can indicate a cardiac emergency.",
    },
    {
      test: () => /(thunderclap|worst.*(ever|life)|sudden.*severe)/.test(parts) && /head/.test(parts),
      reason: "A sudden, severe 'worst-ever' headache needs immediate evaluation.",
    },
    {
      test: () => /(one[- ]sided|face droop|slur|weakness|numb).*(arm|leg|face)|stroke/.test(parts),
      reason: "One-sided weakness, facial droop or slurred speech may indicate a stroke.",
    },
    {
      test: () => /(can'?t breathe|difficulty breathing|gasping|blue lips)/.test(parts),
      reason: "Difficulty breathing needs urgent medical attention.",
    },
    {
      test: () => /(severe bleed|heavy bleeding|won'?t stop bleeding)/.test(parts),
      reason: "Severe bleeding needs urgent care.",
    },
    {
      test: () => /(swell).*(face|lip|tongue|throat)|anaphylax/.test(parts),
      reason: "Swelling of face, lips or tongue may be a severe allergic reaction.",
    },
    {
      test: () => input.severity >= 9,
      reason: "You rated the severity as extreme (9–10/10).",
    },
  ];

  for (const r of rules) if (r.test()) return r.reason;
  return null;
}
