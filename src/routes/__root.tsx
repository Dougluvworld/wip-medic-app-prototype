import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { OfflineBanner } from "@/components/OfflineBanner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-3xl gradient-primary text-primary-foreground shadow-float">
          <span className="text-2xl font-bold">404</span>
        </div>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The screen you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full gradient-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft"
        >
          Back to Medi-Care
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again in a moment.</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full gradient-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// Runs before hydration so dark-mode users don't get a flash of light theme.
// Honours system preference when no explicit choice is stored.
const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('medi-care.dark');var d=t==='1'||(t===null&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');}}catch(e){}`;

const JSON_LD_ORG = {
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  name: "Medi-Care",
  description:
    "AI-powered symptom guidance and care navigation, personalised for you.",
  publisher: {
    "@type": "Organization",
    name: "Medi-Care",
  },
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0B7A75" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Medi-Care" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "format-detection", content: "telephone=no" },
      { title: "Medi-care" },
      { name: "description", content: "AI-powered healthcare navigation. Understand your symptoms and find the right care nearby, in minutes." },
      { property: "og:title", content: "Medi-care" },
      { property: "og:description", content: "AI-powered healthcare navigation. Understand your symptoms and find the right care nearby, in minutes." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Medi-Care" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Medi-care" },
      { name: "twitter:description", content: "AI-powered healthcare navigation. Understand your symptoms and find the right care nearby, in minutes." },
      { property: "og:image", content: "/og-cover.jpg" },
      { name: "twitter:image", content: "/og-cover.jpg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon", sizes: "512x512" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(JSON_LD_ORG),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Pre-hydration theme init — MUST run before body paints. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
