import { useCallback, useEffect, useState } from "react";

/**
 * Centralised theme management.
 * Stored values in localStorage under `medi-care.dark`:
 *   "1"  -> user chose dark
 *   "0"  -> user chose light
 *   null -> follow system (prefers-color-scheme)
 */
export const THEME_STORAGE_KEY = "medi-care.dark";

export type ThemeChoice = "light" | "dark" | "system";

function getSystemDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readStored(): "1" | "0" | null {
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "1" || v === "0") return v;
    return null;
  } catch {
    return null;
  }
}

function applyDarkClass(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
}

// Cross-component subscription so toggling in one place updates all mounts.
type Listener = () => void;
const listeners = new Set<Listener>();
function notify() {
  listeners.forEach((l) => l());
}

export function useTheme() {
  const [isDark, setIsDark] = useState(false);
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    const stored = readStored();
    const next: ThemeChoice = stored === "1" ? "dark" : stored === "0" ? "light" : "system";
    const dark = stored === "1" ? true : stored === "0" ? false : getSystemDark();
    setChoice(next);
    setIsDark(dark);
    applyDarkClass(dark);
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
    const l: Listener = () => refresh();
    listeners.add(l);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSys = () => {
      if (readStored() === null) refresh();
    };
    mq.addEventListener?.("change", onSys);
    return () => {
      listeners.delete(l);
      mq.removeEventListener?.("change", onSys);
    };
  }, [refresh]);

  const setTheme = useCallback((next: ThemeChoice) => {
    try {
      if (next === "system") {
        window.localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        window.localStorage.setItem(THEME_STORAGE_KEY, next === "dark" ? "1" : "0");
      }
    } catch {
      /* ignore */
    }
    notify();
  }, []);

  const toggle = useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  return { isDark, choice, ready, setTheme, toggle };
}
