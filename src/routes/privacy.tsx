import { createFileRoute } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy — Medi-Care" },
      { name: "description", content: "How Medi-Care handles your health data." },
      { property: "og:title", content: "Privacy policy — Medi-Care" },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        <ScreenHeader title="Privacy policy" back="auto" backFallback="/settings" />
        <article className="prose flex-1 space-y-4 px-5 py-5 text-sm leading-relaxed text-foreground/90">
          <p className="text-xs text-muted-foreground">Last updated: July 2026 · Prototype</p>

          <h2 className="text-base font-semibold">What we store</h2>
          <p>
            Your profile (name, date of birth, allergies, emergency contact), your assessment
            history, and app preferences are stored <strong>on this device only</strong>, using your
            browser's local storage.
          </p>

          <h2 className="text-base font-semibold">What we send to the AI</h2>
          <p>
            When you run a symptom check, we send your answers plus the personal-health context you
            chose to add (age, conditions, medications, allergies) to our AI provider so it can
            reason about your symptoms. We don't send your name, contact details, or history.
          </p>

          <h2 className="text-base font-semibold">Location</h2>
          <p>
            Location is used only while you're on the "Find care" screen, to compute distances to
            nearby providers. Access is requested per session and never stored.
          </p>

          <h2 className="text-base font-semibold">Analytics</h2>
          <p>
            This prototype collects no third-party analytics. Any future analytics will be
            privacy-preserving and disclosed here first.
          </p>

          <h2 className="text-base font-semibold">Your controls</h2>
          <p>
            You can export or delete all your data at any time from Settings. Because everything is
            on your device, uninstalling the app or clearing browser storage also removes it.
          </p>

          <h2 className="text-base font-semibold">Contact</h2>
          <p>
            Questions about privacy: this prototype has no support channel yet. A contact address
            will be added prior to any production launch.
          </p>
        </article>
        <BottomNav />
      </div>
    </PhoneFrame>
  );
}
