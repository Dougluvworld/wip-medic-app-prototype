import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

/**
 * Floating top-right theme toggle. Absolutely positioned inside PhoneFrame,
 * so it appears on every screen without affecting page layout.
 */
export function ThemeToggle() {
  const { isDark, toggle, ready } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="absolute right-3 top-[calc(env(safe-area-inset-top)+12px)] z-40 flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/70 text-foreground/80 shadow-sm backdrop-blur-md transition hover:bg-background hover:text-foreground active:scale-95"
    >
      {ready && isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
