// Compute open/closed status from a simple weekly schedule, in real time.
// Kept intentionally small — providers declare open/close hours (24h) per weekday.
// 0 = Sunday ... 6 = Saturday. Use `null` for closed on that day.

export type DaySchedule = { open: number; close: number } | null | "24h";
export type WeeklySchedule = DaySchedule[]; // length 7, Sun..Sat

export function isOpenNow(schedule: WeeklySchedule, now: Date = new Date()): boolean {
  const day = schedule[now.getDay()];
  if (!day) return false;
  if (day === "24h") return true;
  const mins = now.getHours() * 60 + now.getMinutes();
  const openMins = day.open * 60;
  const closeMins = day.close * 60;
  if (closeMins <= openMins) {
    // overnight (e.g., 20 -> 02)
    return mins >= openMins || mins < closeMins;
  }
  return mins >= openMins && mins < closeMins;
}

export function nextOpenLabel(schedule: WeeklySchedule, now: Date = new Date()): string {
  for (let i = 0; i < 7; i++) {
    const idx = (now.getDay() + i) % 7;
    const day = schedule[idx];
    if (!day) continue;
    if (day === "24h") return "Open 24 hours";
    if (i === 0 && now.getHours() * 60 + now.getMinutes() < day.open * 60) {
      return `Opens at ${fmt(day.open)}`;
    }
    if (i > 0) {
      const name = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][idx];
      return `Opens ${name} ${fmt(day.open)}`;
    }
  }
  return "Closed";
}

export function currentHoursLabel(schedule: WeeklySchedule, now: Date = new Date()): string {
  const day = schedule[now.getDay()];
  if (day === "24h") return "Open 24 hours";
  if (day && isOpenNow(schedule, now)) return `Open until ${fmt(day.close)}`;
  return nextOpenLabel(schedule, now);
}

function fmt(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
