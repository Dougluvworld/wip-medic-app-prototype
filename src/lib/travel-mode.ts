import { useEffect, useState } from "react";

export type TravelMode = "home" | "away" | "unknown";

export type TravelState = {
  mode: TravelMode;
  homeCountry: string; // ISO2, from browser locale
  currentCountry: string | null; // ISO2, detected via timezone
  countryName: string | null; // pretty name for the current country
  dismissed: boolean; // banner dismissed by user
};

const STORAGE_KEY = "medi-care.travel-mode.v1";

// Common tourist timezones → ISO country code. Prototype-grade coverage.
const TZ_TO_COUNTRY: Record<string, string> = {
  "Europe/London": "GB",
  "Europe/Dublin": "IE",
  "Europe/Paris": "FR",
  "Europe/Madrid": "ES",
  "Europe/Lisbon": "PT",
  "Europe/Rome": "IT",
  "Europe/Berlin": "DE",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Zurich": "CH",
  "Europe/Vienna": "AT",
  "Europe/Athens": "GR",
  "Europe/Warsaw": "PL",
  "Europe/Prague": "CZ",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
  "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI",
  "Europe/Istanbul": "TR",
  "Africa/Cairo": "EG",
  "Africa/Casablanca": "MA",
  "Africa/Johannesburg": "ZA",
  "Africa/Lagos": "NG",
  "Africa/Nairobi": "KE",
  "Africa/Accra": "GH",
  "Asia/Dubai": "AE",
  "Asia/Bangkok": "TH",
  "Asia/Singapore": "SG",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Hong_Kong": "HK",
  "Asia/Tokyo": "JP",
  "Asia/Seoul": "KR",
  "Asia/Shanghai": "CN",
  "Asia/Kolkata": "IN",
  "Asia/Karachi": "PK",
  "Asia/Dhaka": "BD",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Perth": "AU",
  "Pacific/Auckland": "NZ",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Phoenix": "US",
  "America/Anchorage": "US",
  "Pacific/Honolulu": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Mexico_City": "MX",
  "America/Sao_Paulo": "BR",
  "America/Buenos_Aires": "AR",
  "America/Santiago": "CL",
};

const COUNTRY_NAME: Record<string, string> = {
  GB: "the UK", IE: "Ireland", US: "the US", CA: "Canada", MX: "Mexico",
  AU: "Australia", NZ: "New Zealand",
  IN: "India", PK: "Pakistan", BD: "Bangladesh",
  NG: "Nigeria", ZA: "South Africa", KE: "Kenya", GH: "Ghana", EG: "Egypt", MA: "Morocco",
  JP: "Japan", CN: "China", HK: "Hong Kong", SG: "Singapore", MY: "Malaysia",
  KR: "South Korea", TH: "Thailand", AE: "the UAE", TR: "Türkiye",
  BR: "Brazil", AR: "Argentina", CL: "Chile",
  DE: "Germany", FR: "France", ES: "Spain", IT: "Italy", NL: "the Netherlands",
  BE: "Belgium", PT: "Portugal", SE: "Sweden", NO: "Norway", DK: "Denmark",
  FI: "Finland", PL: "Poland", CZ: "Czechia", AT: "Austria", CH: "Switzerland",
  GR: "Greece",
};

function homeCountryFromLocale(): string {
  if (typeof navigator === "undefined") return "GB";
  const langs = [navigator.language, ...(navigator.languages ?? [])];
  for (const l of langs) {
    const m = l?.match(/[-_]([A-Z]{2})/i);
    if (m) return m[1].toUpperCase();
  }
  return "GB";
}

function currentCountryFromTimezone(): string | null {
  if (typeof Intl === "undefined") return null;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TZ_TO_COUNTRY[tz] ?? null;
  } catch {
    return null;
  }
}

export function countryName(cc: string | null): string | null {
  if (!cc) return null;
  return COUNTRY_NAME[cc] ?? cc;
}

function load(): Partial<TravelState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<TravelState>) : {};
  } catch {
    return {};
  }
}

function save(state: Pick<TravelState, "mode" | "dismissed">) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

// Module-level listeners so multiple components stay in sync
const listeners = new Set<() => void>();
function emit() { listeners.forEach((fn) => fn()); }

export function useTravelState(): TravelState & {
  setMode: (m: TravelMode) => void;
  dismiss: () => void;
} {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  // Detect (client-only, effects only)
  const [detected, setDetected] = useState<{ home: string; current: string | null }>(
    { home: "GB", current: null },
  );
  useEffect(() => {
    setDetected({ home: homeCountryFromLocale(), current: currentCountryFromTimezone() });
  }, []);

  const stored = load();
  const state: TravelState = {
    homeCountry: detected.home,
    currentCountry: detected.current,
    countryName: countryName(detected.current),
    mode: stored.mode ?? (detected.current && detected.current !== detected.home ? "away" : "home"),
    dismissed: stored.dismissed ?? false,
  };
  // tick is only used to re-render on emit()
  void tick;

  return {
    ...state,
    setMode: (m) => { save({ mode: m, dismissed: true }); emit(); },
    dismiss: () => { save({ mode: state.mode, dismissed: true }); emit(); },
  };
}

// Should the banner be shown right now?
export function shouldShowTravelBanner(s: TravelState): boolean {
  return (
    !s.dismissed &&
    !!s.currentCountry &&
    s.currentCountry !== s.homeCountry
  );
}
