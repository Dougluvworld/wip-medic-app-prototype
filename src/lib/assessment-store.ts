import { useSyncExternalStore } from "react";
import type { AssessmentResult } from "./assessment.functions";
import type { FollowUpAnswer } from "./follow-ups";

type AssessmentState = {
  mainSymptom: string | null;
  bodyArea: string | null;
  duration: string | null;
  severity: number; // 1-10
  additional: string[];
  followUpAnswers: FollowUpAnswer[];
  redFlag: string | null;
  aiResult: AssessmentResult | null;
  aiError: string | null;
};

const initial: AssessmentState = {
  mainSymptom: null,
  bodyArea: null,
  duration: null,
  severity: 4,
  additional: [],
  followUpAnswers: [],
  redFlag: null,
  aiResult: null,
  aiError: null,
};

let state: AssessmentState = { ...initial };
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }

export const assessmentStore = {
  get: () => state,
  set: (patch: Partial<AssessmentState>) => {
    state = { ...state, ...patch };
    emit();
  },
  addFollowUp: (ans: FollowUpAnswer) => {
    state = { ...state, followUpAnswers: [...state.followUpAnswers, ans] };
    emit();
  },
  toggleAdditional: (s: string) => {
    const has = state.additional.includes(s);
    state = { ...state, additional: has ? state.additional.filter((x) => x !== s) : [...state.additional, s] };
    emit();
  },
  reset: () => { state = { ...initial }; emit(); },
  subscribe: (l: () => void) => { listeners.add(l); return () => listeners.delete(l); },
};

export function useAssessment() {
  return useSyncExternalStore(
    assessmentStore.subscribe,
    assessmentStore.get,
    assessmentStore.get,
  );
}
