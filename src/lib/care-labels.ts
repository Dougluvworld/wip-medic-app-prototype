import type { TravelMode } from "./travel-mode";

/** Display label for a "GP-like" provider given travel mode. */
export function careLabel(mode: TravelMode, kind: "short" | "long" = "short"): string {
  if (mode === "away") {
    return kind === "long" ? "Walk-in doctor or local clinic" : "Walk-in doctor";
  }
  return "GP";
}
