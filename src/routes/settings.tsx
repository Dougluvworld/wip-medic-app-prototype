import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomNav } from "@/components/BottomNav";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  Bell,
  ChevronRight,
  Download,
  FileText,
  Globe,
  HeartPulse,
  LifeBuoy,
  LogOut,
  Moon,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { THEME_STORAGE_KEY, useTheme } from "@/hooks/useTheme";

const DARK_KEY = THEME_STORAGE_KEY;
const NOTIFS_KEY = "medi-care.notifs";
const APP_KEYS = [
  "medi-care.profile",
  "medi-care.history",
  "medi-care.onboarded",
  DARK_KEY,
  NOTIFS_KEY,
  "medi-care.travel",
  "medi-care.location-prompt-dismissed",
];

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — Medi-Care" }, { name: "robots", content: "noindex" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { isDark, choice, setTheme } = useTheme();
  const [notifs, setNotifs] = useState(true);
  const [ready, setReady] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const nav = useNavigate();

  // Hydrate from localStorage after mount to avoid SSR mismatch.
  useEffect(() => {
    try {
      const n = window.localStorage.getItem(NOTIFS_KEY);
      if (n !== null) setNotifs(n === "1");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(NOTIFS_KEY, notifs ? "1" : "0"); } catch { /* ignore */ }
  }, [notifs, ready]);

  const exportData = () => {
    try {
      const dump: Record<string, unknown> = {
        exportedAt: new Date().toISOString(),
        app: "Medi-Care",
      };
      for (const k of APP_KEYS) {
        const raw = window.localStorage.getItem(k);
        if (raw == null) continue;
        try {
          dump[k] = JSON.parse(raw);
        } catch {
          dump[k] = raw;
        }
      }
      const blob = new Blob([JSON.stringify(dump, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medi-care-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Your data has been downloaded");
    } catch {
      toast.error("Couldn't export — check browser permissions");
    }
  };

  const deleteAll = () => {
    try {
      APP_KEYS.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    document.documentElement.classList.remove("dark");
    toast.success("All data deleted");
    nav({ to: "/" });
  };

  const resetDemo = () => {
    deleteAll();
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

          <Group title="Your data">
            <ActionRow
              icon={<Download className="h-4 w-4" />}
              label="Export your data"
              sub="Download everything as a JSON file"
              onClick={exportData}
            />
            {confirmingDelete ? (
              <div className="flex flex-col gap-2 px-4 py-3.5">
                <p className="text-sm font-semibold text-destructive">
                  Delete all data on this device?
                </p>
                <p className="text-xs text-muted-foreground">
                  Your profile, history, and preferences will be wiped. This can't be undone.
                </p>
                <div className="mt-1 flex gap-2">
                  <button
                    onClick={deleteAll}
                    className="flex-1 rounded-xl bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground"
                  >
                    Yes, delete everything
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <ActionRow
                icon={<Trash2 className="h-4 w-4" />}
                label="Delete all data"
                sub="Wipe this device"
                destructive
                onClick={() => setConfirmingDelete(true)}
              />
            )}
          </Group>

          <Group title="Legal">
            <LinkRow icon={<FileText className="h-4 w-4" />} label="Terms of use" to="/terms" />
            <LinkRow icon={<ShieldCheck className="h-4 w-4" />} label="Privacy policy" to="/privacy" />
          </Group>

          <Group title="Help">
            <SoonRow icon={<LifeBuoy className="h-4 w-4" />} label="Support" value="Help center · Contact us" />
            <SoonRow icon={<HeartPulse className="h-4 w-4" />} label="Sync across devices" value="Coming later" />
          </Group>

          <button
            onClick={resetDemo}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 py-4 text-sm font-semibold text-destructive"
          >
            <LogOut className="h-4 w-4" /> Reset demo
          </button>

          <p className="pb-4 text-center text-[11px] leading-relaxed text-muted-foreground">
            Medi-Care · v0.1.0 · MVP Prototype
            <br />
            Your medical data is stored on this device only and never sold.
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

function ActionRow({
  icon,
  label,
  sub,
  destructive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-accent/40"
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
          destructive ? "bg-destructive/10 text-destructive" : "bg-accent text-primary"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${destructive ? "text-destructive" : ""}`}>{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
    </button>
  );
}

function LinkRow({ icon, label, to }: { icon: React.ReactNode; label: string; to: "/terms" | "/privacy" }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent/40">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-primary">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
    </Link>
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
