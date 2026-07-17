import { createFileRoute } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of use — Medi-Care" },
      { name: "description", content: "Terms of use for the Medi-Care symptom guidance app." },
      { property: "og:title", content: "Terms of use — Medi-Care" },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PhoneFrame>
      <div className="flex min-h-full flex-col">
        <ScreenHeader title="Terms of use" back="auto" backFallback="/settings" />
        <article className="prose flex-1 space-y-4 px-5 py-5 text-sm leading-relaxed text-foreground/90">
          <p className="text-xs text-muted-foreground">Last updated: July 2026 · Prototype</p>

          <h2 className="text-base font-semibold">1. What Medi-Care is</h2>
          <p>
            Medi-Care is a symptom-guidance and care-navigation tool. It is <strong>not</strong>{" "}
            a medical device, does not provide a diagnosis, and is not a substitute for professional
            medical advice, examination, or treatment.
          </p>

          <h2 className="text-base font-semibold">2. Emergencies</h2>
          <p>
            If you believe you are experiencing a medical emergency, call your local emergency
            services immediately. Do not rely on Medi-Care to decide whether to seek emergency care.
          </p>

          <h2 className="text-base font-semibold">3. Acceptable use</h2>
          <p>
            You agree to use Medi-Care for your own personal, non-commercial health guidance. Don't
            attempt to reverse-engineer, scrape, or misuse the service.
          </p>

          <h2 className="text-base font-semibold">4. No warranty</h2>
          <p>
            The service is provided "as is" without warranties of any kind. To the fullest extent
            permitted by law, Medi-Care disclaims liability for any harm arising from use of the app.
          </p>

          <h2 className="text-base font-semibold">5. Changes</h2>
          <p>
            We may update these terms as the product evolves. Continued use of the app after changes
            means you accept the updated terms.
          </p>

          <p className="pt-4 text-xs text-muted-foreground">
            This is a placeholder page for prototype review purposes. Final terms will be produced with legal counsel prior to any production launch.
          </p>
        </article>
        <BottomNav />
      </div>
    </PhoneFrame>
  );
}
