import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "medi-care.install-dismissed";

/**
 * Shows a subtle "Install Medi-Care" chip on Home when the browser fires
 * `beforeinstallprompt` (Android Chrome, desktop Chrome/Edge). Dismissible.
 */
export function InstallPrompt() {
  const [event, setEvent] = useState<BIPEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      /* ignore */
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setEvent(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") setEvent(null);
  };

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (!event || dismissed) return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-accent/60 p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-soft">
        <Download className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold">Install Medi-Care</p>
        <p className="text-[11px] text-muted-foreground">Add to your home screen for one-tap access.</p>
      </div>
      <button
        onClick={install}
        className="rounded-full gradient-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-soft"
      >
        Install
      </button>
      <button
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
