import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Stethoscope, MapPin, User, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const leftItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/care", label: "Care", icon: MapPin },
] as const;

const rightItems = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);
  const isActive = (to: string) =>
    pathname === to || (to !== "/home" && pathname.startsWith(to));

  useEffect(() => {
    setPortalTarget(document.querySelector("[data-bottom-nav-slot]"));
  }, []);

  const nav = (
    <nav className="absolute bottom-0 left-0 right-0 z-30 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <ul className="relative grid h-16 grid-cols-5 items-center px-2">
        {leftItems.map(({ to, label, icon: Icon }) => (
          <NavItem key={to} to={to} label={label} Icon={Icon} active={isActive(to)} />
        ))}

        {/* Center FAB — Assess. Absolutely positioned so it doesn't affect row height. */}
        <li className="flex justify-center">
          <Link
            to="/assess"
            aria-label="Start symptom check"
            className="absolute left-1/2 top-0 grid h-14 w-14 -translate-x-1/2 -translate-y-1/3 place-items-center rounded-full gradient-primary text-primary-foreground shadow-float ring-4 ring-background transition-colors active:opacity-90"
          >
            <Stethoscope className="h-6 w-6" strokeWidth={2.2} />
          </Link>
        </li>

        {rightItems.map(({ to, label, icon: Icon }) => (
          <NavItem key={to} to={to} label={label} Icon={Icon} active={isActive(to)} />
        ))}
      </ul>
    </nav>
  );

  return portalTarget ? createPortal(nav, portalTarget) : nav;
}

function NavItem({
  to,
  label,
  Icon,
  active,
}: {
  to: "/home" | "/care" | "/profile" | "/settings";
  label: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
}) {
  return (
    <li>
      <Link
        to={to}
        className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-colors"
      >
        <Icon
          className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`}
          strokeWidth={2.2}
        />
        <span
          className={`text-[10px] font-medium ${
            active ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {label}
        </span>
      </Link>
    </li>
  );
}
