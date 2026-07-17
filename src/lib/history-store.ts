// Persist recent AI assessment summaries so Home can show real history.

export type HistoryEntry = {
  id: string;
  date: number; // epoch ms
  mainSymptom: string;
  urgency: "Low" | "Medium" | "High";
  topCondition: string;
  action: string;
};

const KEY = "medi-care.history";
const CAP = 20;

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveHistoryEntry(entry: Omit<HistoryEntry, "id" | "date">) {
  if (typeof window === "undefined") return;
  const list = loadHistory();
  const id = `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  // De-dupe: don't push a duplicate of the last entry within 60s.
  const last = list[0];
  if (last && last.mainSymptom === entry.mainSymptom && Date.now() - last.date < 60_000) return;
  const next: HistoryEntry[] = [{ id, date: Date.now(), ...entry }, ...list].slice(0, CAP);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const day = 86_400_000;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < day) return `${Math.round(diff / 3_600_000)}h ago`;
  if (diff < 7 * day) return `${Math.round(diff / day)}d ago`;
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
