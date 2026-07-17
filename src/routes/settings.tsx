import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Bell, ChevronRight, Globe, HeartPulse, LifeBuoy, LogOut, Moon, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const DARK_KEY = "medi-care.dark";
const NOTIFS_KEY = "medi-care.notifs";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — Medi-Care" }, { name: "robots", content: "noindex" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [dark, setDark] = useState(false);
  const [notifs, setNotifs] = useState(true);
  const [ready, setReady] = useState(false);
  const nav = useNavigate();

  // Hydrate from localStorage after mount to avoid SSR mismatch.
  useEffect(() => {
    try {
      setDark(window.localStorage.getItem(DARK_KEY) === "1");
      const n = window.localStorage.getItem(NOTIFS_KEY);
      if (n !== null) setNotifs(n === "1");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", dark);
    try { window.localStorage.setItem(DARK_KEY, dark ? "1" : "0"); } catch { /* ignore */ }
  }, [dark, ready]);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(NOTIFS_KEY, notifs ? "1" : "0"); } catch { /* ignore */ }
  }, [notifs, ready]);

  const resetDemo = () => {
    try {
      const keys = ["medi-care.profile", "medi-care.history", "medi-care.onboarded", DARK_KEY, NOTIFS_KEY, "medi-care.travel", "medi-care.location-prompt-dismissed"];
      keys.forEach((k) => window.localStorage.removeItem(k));
    } catch { /* ignore */ }
    document.documentElement.classList.remove("dark");
    toast.success("Demo reset — starting fresh");
    nav({ to: "/" });
  };

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        <ScreenHeader title="Settings" back="auto" backFallback="/home" />

        <div className="flex-1 space-y-6 px-5 py-5">
          <Group title="Preferences">
            <ToggleRow icon={<Moon className="h-4 w-4" />} label="Dark mode" sub="Easier on the eyes at night" value={dark} onChange={setDark} />
            <ToggleRow icon={<Bell className="h-4 w-4" />} label="Notifications" sub="Reminders & health tips" value={notifs} onChange={setNotifs} />
            <SoonRow icon={<Globe className="h-4 w-4" />} label="Language" value="English (UK)" />
          </Group>

          <Group title="Privacy & data">
            <SoonRow icon={<ShieldCheck className="h-4 w-4" />} label="Privacy" value="Manage permissions" />
            <SoonRow icon={<HeartPulse className="h-4 w-4" />} label="Medical data" value="Export or delete" />
          </Group>

          <Group title="Help">
            <SoonRow icon={<LifeBuoy className="h-4 w-4" />} label="Support" value="Help center · Contact us" />
          </Group>

          <button
            onClick={resetDemo}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 py-4 text-sm font-semibold text-destructive"
          >
            <LogOut className="h-4 w-4" /> Reset demo
          </button>

          <p className="pb-4 text-center text-[11px] text-muted-foreground">
            Medi-Care · v0.1.0 · MVP Prototype
          </p>
        </div>

        <BottomNav />
      </div>
    </PhoneFrame>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({ icon, label, sub, value, onChange }: { icon: React.ReactNode; label: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-primary">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
        aria-label={label}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-soft transition-all ${value ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function SoonRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex w-full items-center gap-3 px-4 py-3.5 opacity-70">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-primary">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{label}</p>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            Soon
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">{value}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
    </div>
  );
}
