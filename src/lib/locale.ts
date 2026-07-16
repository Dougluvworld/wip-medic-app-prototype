import { useEffect, useState } from "react";

export type EmergencyInfo = {
  number: string;
  country: string;
  label: string; // e.g. "Emergency (999)"
};

// Country-code → emergency number. Fallback: 112 (works in most of the world).
const BY_COUNTRY: Record<string, string> = {
  GB: "999", IE: "112", US: "911", CA: "911", MX: "911",
  AU: "000", NZ: "111",
  IN: "112", PK: "115", BD: "999",
  NG: "112", ZA: "10111", KE: "999", GH: "112",
  JP: "119", CN: "120", HK: "999", SG: "995", MY: "999",
  BR: "192", AR: "911", CL: "131",
  // EU default 112
  DE: "112", FR: "112", ES: "112", IT: "112", NL: "112",
  BE: "112", PT: "112", SE: "112", NO: "112", DK: "112",
  FI: "112", PL: "112", CZ: "112", AT: "112", CH: "112",
};

function countryFromLocale(): string {
  if (typeof navigator === "undefined") return "IE";
  const langs = [navigator.language, ...(navigator.languages ?? [])];
  for (const l of langs) {
    const m = l?.match(/[-_]([A-Z]{2})/i);
    if (m) return m[1].toUpperCase();
  }
  return "IE";
}

export function getEmergencyInfo(country?: string): EmergencyInfo {
  const c = (country ?? countryFromLocale()).toUpperCase();
  const number = BY_COUNTRY[c] ?? "112";
  return { number, country: c, label: `Emergency (${number})` };
}

export function useEmergencyInfo(): EmergencyInfo {
  const [info, setInfo] = useState<EmergencyInfo>(() => getEmergencyInfo());
  useEffect(() => {
    // Refresh on mount in case navigator wasn't available during SSR
    setInfo(getEmergencyInfo());
  }, []);
  return info;
}
