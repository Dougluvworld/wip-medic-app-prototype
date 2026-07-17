import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Stethoscope, MapPin, User, Settings } from "lucide-react";

const sideItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/care", label: "Care", icon: MapPin },
] as const;

const rightItems = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) =>
    pathname === to || (to !== "/home" && pathname.startsWith(to));

  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <ul className="relative grid grid-cols-5 items-end px-2 pt-1.5 pb-1">
        {sideItems.map(({ to, label, icon: Icon }) => (
          <NavItem key={to} to={to} label={label} Icon={Icon} active={isActive(to)} />
        ))}

        {/* Center FAB — Assess */}
        <li className="flex justify-center">
          <Link
            to="/assess"
            aria-label="Start symptom check"
            className={`relative -mt-6 grid h-14 w-14 place-items-center rounded-full gradient-primary text-primary-foreground shadow-float ring-4 ring-background transition-transform active:scale-95 ${
              isActive("/assess") ? "scale-105" : ""
            }`}
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
        className="flex flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors"
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
