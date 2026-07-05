import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Bell, ChevronRight, Globe, HeartPulse, LifeBuoy, LogOut, Moon, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — Medi-Care" }, { name: "robots", content: "noindex" }],
  }),
  component: Settings,
});

function Settings() {
  const [dark, setDark] = useState(false);
  const [notifs, setNotifs] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        <ScreenHeader title="Settings" back="/home" />

        <div className="flex-1 space-y-6 px-5 py-5">
          <Group title="Preferences">
            <ToggleRow icon={<Moon className="h-4 w-4" />} label="Dark mode" sub="Easier on the eyes at night" value={dark} onChange={setDark} />
            <ToggleRow icon={<Bell className="h-4 w-4" />} label="Notifications" sub="Reminders & health tips" value={notifs} onChange={setNotifs} />
            <LinkRow icon={<Globe className="h-4 w-4" />} label="Language" value="English (UK)" />
          </Group>

          <Group title="Privacy & data">
            <LinkRow icon={<ShieldCheck className="h-4 w-4" />} label="Privacy" value="Manage permissions" />
            <LinkRow icon={<HeartPulse className="h-4 w-4" />} label="Medical data" value="Export or delete" />
          </Group>

          <Group title="Help">
            <LinkRow icon={<LifeBuoy className="h-4 w-4" />} label="Support" value="Help center · Contact us" />
          </Group>

          <button
            onClick={() => nav({ to: "/" })}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 py-4 text-sm font-semibold text-destructive"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>

          <p className="pb-4 text-center text-[11px] text-muted-foreground">
            Medi-Care · v0.1.0 · MVP Prototype
          </p>
        </div>
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
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-soft transition-all ${value ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function LinkRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-primary">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{value}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
