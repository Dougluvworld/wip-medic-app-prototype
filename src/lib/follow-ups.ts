// Adaptive follow-up questions per main symptom + red-flag rules.

export type FollowUp = {
  id: string;
  prompt: string;
  voiceSample: string;
  skipIf?: RegExp;
  /**
   * Plain-language explanation of why this question is asked. Surfaced in the
   * assessment UI via a "Why are we asking this?" link. Never mentions the
   * underlying rules or AI prompts.
   */
  why?: string;
};


export type FollowUpAnswer = { id: string; prompt: string; answer: string };

const FOLLOWUPS: Record<string, FollowUp[]> = {
  chest: [
    { id: "chest-breath", prompt: "Does the pain change when you breathe deeply or move?", voiceSample: "It gets sharper when I breathe in", why: "Chest pain that changes with breathing usually points to a muscle or lung cause rather than the heart. Your answer helps us suggest the right level of care." },
    { id: "chest-radiate", prompt: "Is the pain spreading to your arm, jaw, neck, or back?", voiceSample: "No, it stays in the chest", why: "Some symptoms, when they occur together, can indicate conditions that need urgent medical attention. This helps us recommend the most appropriate level of care." },
    { id: "chest-sob", prompt: "Are you feeling short of breath, sweaty, or dizzy with it?", voiceSample: "A little short of breath", why: "Chest pain combined with breathlessness, sweating or dizziness is treated more urgently. Your answer helps us guide you to the right care." },
  ],
  head: [
    { id: "head-onset", prompt: "Did it come on suddenly — like a thunderclap — or build gradually?", voiceSample: "It built up over a few hours", why: "How quickly a headache started can make a big difference to the recommended next step." },
    { id: "head-neuro", prompt: "Any vision changes, weakness on one side, or confusion?", voiceSample: "No, nothing like that", why: "These symptoms alongside a headache can point to conditions that need urgent evaluation, so we always ask." },
    { id: "head-neck", prompt: "Any neck stiffness, fever, or sensitivity to light?", voiceSample: "Bit of light sensitivity", why: "These signs help us tell a simple headache apart from something that needs faster attention." },
  ],
  abdomen: [
    { id: "abd-where", prompt: "Where exactly does it hurt — upper, lower, one side?", voiceSample: "Lower right side", skipIf: /\b(upper|lower|left|right|middle|centre|center|one[- ]sided|side)\b/i, why: "Different areas of the abdomen relate to different organs, which changes the guidance we give." },
    { id: "abd-assoc", prompt: "Any vomiting, blood, or fever with it?", voiceSample: "Some nausea, no blood", why: "These extra symptoms can change how urgent abdominal pain is." },
  ],

  throat: [
    { id: "throat-swallow", prompt: "Is it painful to swallow, or is your voice affected?", voiceSample: "Painful to swallow", why: "How the throat is affected helps us tell common infections apart from ones that may need faster review." },
    { id: "throat-fever", prompt: "Any fever, swollen glands, or white patches at the back of the throat?", voiceSample: "Mild fever", why: "These extra clues help us suggest the most appropriate next step." },
  ],
  back: [
    { id: "back-radiate", prompt: "Does the pain shoot down into your legs or buttocks?", voiceSample: "It goes into my right leg", why: "Pain that travels down the leg can indicate nerve involvement, which changes the recommended care." },
    { id: "back-numb", prompt: "Any numbness, weakness, or loss of bladder/bowel control?", voiceSample: "No numbness", why: "These specific symptoms can indicate something that needs urgent medical attention, so we always check." },
  ],
  skin: [
    { id: "rash-spread", prompt: "Is it spreading, painful, or itchy?", voiceSample: "Very itchy and spreading", why: "How a rash is behaving helps us tell common irritations apart from allergic or infectious causes." },
    { id: "rash-swelling", prompt: "Any swelling of your face, lips, or tongue, or trouble breathing?", voiceSample: "No swelling", why: "These symptoms can indicate a severe allergic reaction that needs urgent care." },
  ],
  cough: [
    { id: "cough-sputum", prompt: "Are you coughing anything up? What colour?", voiceSample: "Yellow mucus", why: "What comes up with a cough (or not) is a useful clue for the type of illness." },
    { id: "cough-breath", prompt: "Any wheezing, chest tightness, or shortness of breath?", voiceSample: "A bit of wheezing", why: "Breathing symptoms alongside a cough can change how urgent it is to be seen." },
  ],
  generic: [
    { id: "gen-worse", prompt: "Is it getting better, worse, or staying about the same?", voiceSample: "Slowly getting worse", why: "The direction things are heading in is one of the strongest guides for what to do next." },
    { id: "gen-tried", prompt: "Have you tried anything for it so far?", voiceSample: "Paracetamol, didn't help much", why: "Knowing what's already been tried helps us give useful next steps rather than repeating what didn't help." },
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

export function pickFollowUps(mainSymptom: string | null, bodyArea: string | null, priorText = ""): FollowUp[] {
  const hay = `${mainSymptom ?? ""} ${bodyArea ?? ""}`.toLowerCase();
  const context = `${mainSymptom ?? ""} ${priorText}`;
  for (const [key, group] of Object.entries(AREA_ALIASES)) {
    if (hay.includes(key)) return FOLLOWUPS[group].filter((f) => !f.skipIf || !f.skipIf.test(context));
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
