import type { Provider } from "./mock-data";

export type CareType = Provider["type"];

export type CareRecommendation = {
  types: CareType[]; // ordered, best first
  reason: string;
};

export function recommendCareTypes(
  urgency: "Low" | "Medium" | "High",
  redFlag: string | null,
): CareRecommendation {
  if (redFlag) {
    return {
      types: ["Hospital", "Urgent Care"],
      reason: "Possible emergency — the nearest Emergency Department is prioritised.",
    };
  }
  if (urgency === "High") {
    return {
      types: ["Urgent Care", "Hospital"],
      reason: "High urgency — walk-in urgent care or an Emergency Department is recommended.",
    };
  }
  if (urgency === "Medium") {
    return {
      types: ["GP", "Urgent Care"],
      reason: "Medium urgency — a GP or walk-in clinic can review you within 24–48 hours.",
    };
  }
  return {
    types: ["Pharmacy", "GP"],
    reason: "Low urgency — a pharmacist can usually help; a GP if it persists.",
  };
}

// Score a provider against a recommendation. Higher = better.
export function scoreProvider(p: Provider, rec: CareRecommendation | null): number {
  let score = 0;
  if (rec) {
    const rank = rec.types.indexOf(p.type);
    if (rank === 0) score += 120;
    else if (rank === 1) score += 80;
    else if (rank > 1) score += 40;
  }
  if (p.openNow) score += 20;
  score -= p.distanceKm * 4;
  return score;
}
