import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Thin banner shown when the browser reports offline.
 * Sits above the app shell so users understand why AI features fail.
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-warning/95 px-4 py-1.5 text-[11px] font-semibold text-warning-foreground shadow-soft backdrop-blur"
    >
      <WifiOff className="h-3.5 w-3.5" />
      You're offline — AI assessment is unavailable
    </div>
  );
}
