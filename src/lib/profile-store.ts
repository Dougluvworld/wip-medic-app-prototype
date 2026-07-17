// Simple localStorage-backed health profile used to personalise assessments.

export type HealthProfile = {
  age?: string;
  gender?: string;
  conditions?: string[];
  medications?: string[];
  allergies?: string[];
};

const KEY = "medi-care.profile";

const defaults: HealthProfile = {
  age: "29",
  gender: "Non-binary",
  conditions: ["Asthma"],
  medications: ["Salbutamol inhaler"],
  allergies: ["Penicillin", "Peanuts"],
};

export function loadProfile(): HealthProfile {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function saveProfile(profile: HealthProfile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}
