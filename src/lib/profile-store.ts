// Simple localStorage-backed health profile used to personalise assessments.

export type EmergencyContact = {
  name?: string;
  relationship?: string;
  phone?: string;
};

export type HealthProfile = {
  name?: string;
  age?: string;
  gender?: string;
  bloodType?: string;
  gpName?: string;
  conditions?: string[];
  medications?: string[];
  allergies?: string[];
  emergencyContact?: EmergencyContact;
};

const KEY = "medi-care.profile";

const defaults: HealthProfile = {
  name: "Alex Morgan",
  age: "29",
  gender: "Non-binary",
  bloodType: "",
  gpName: "",
  conditions: ["Asthma"],
  medications: ["Salbutamol inhaler"],
  allergies: ["Penicillin", "Peanuts"],
  emergencyContact: { name: "", relationship: "", phone: "" },
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

const ONBOARDED_KEY = "medi-care.onboarded";
export function hasOnboarded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ONBOARDED_KEY) === "1";
  } catch {
    return false;
  }
}
export function markOnboarded() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ONBOARDED_KEY, "1");
  } catch {
    /* ignore */
  }
}
