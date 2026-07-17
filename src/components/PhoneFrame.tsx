import type { ReactNode } from "react";

/**
 * PhoneFrame — mobile-first container. On mobile it fills the viewport,
 * on tablet/desktop it renders as a device mock-up for presentation.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-gradient-to-br from-[oklch(0.96_0.02_180)] via-background to-[oklch(0.95_0.03_170)] md:py-10">
      <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background md:min-h-[900px] md:max-h-[900px] md:overflow-hidden md:rounded-[44px] md:border md:border-border md:shadow-float">
        <div className="relative flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
