import { useSyncExternalStore } from "react";

type AssessmentState = {
  mainSymptom: string | null;
  bodyArea: string | null;
  duration: string | null;
  severity: number; // 1-10
  additional: string[];
};

const initial: AssessmentState = {
  mainSymptom: null,
  bodyArea: null,
  duration: null,
  severity: 4,
  additional: [],
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
