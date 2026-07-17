import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";

export type AssessmentInput = {
  mainSymptom: string;
  bodyArea: string | null;
  duration: string | null;
  severity: number;
  additional: string[];
  followUps: Array<{ prompt: string; answer: string }>;
  profile?: {
    age?: string;
    gender?: string;
    conditions?: string[];
    medications?: string[];
    allergies?: string[];
  };
};

export type AssessmentResult = {
  urgency: "Low" | "Medium" | "High";
  urgencyReasons: string[];
  conditions: Array<{ name: string; confidence: number; reasoning: string }>;
  recommendedAction: string;
  whenToSeekHelp: string[];
  usedProfile: boolean;
};

const resultSchema = z.object({
  urgency: z.enum(["Low", "Medium", "High"]),
  urgencyReasons: z.array(z.string()),
  conditions: z.array(
    z.object({
      name: z.string(),
      confidence: z.number(),
      reasoning: z.string(),
    }),
  ),
  recommendedAction: z.string(),
  whenToSeekHelp: z.array(z.string()),
});

export const runAssessment = createServerFn({ method: "POST" })
  .inputValidator((data: AssessmentInput) => data)
  .handler(async ({ data }): Promise<AssessmentResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key, { structuredOutputs: true });
    const model = gateway("openai/gpt-5.5");

    const profileLines: string[] = [];
    if (data.profile?.age) profileLines.push(`Age: ${data.profile.age}`);
    if (data.profile?.gender) profileLines.push(`Sex/gender: ${data.profile.gender}`);
    if (data.profile?.conditions?.length) profileLines.push(`Existing conditions: ${data.profile.conditions.join(", ")}`);
    if (data.profile?.medications?.length) profileLines.push(`Current medications: ${data.profile.medications.join(", ")}`);
    if (data.profile?.allergies?.length) profileLines.push(`Allergies: ${data.profile.allergies.join(", ")}`);
    const usedProfile = profileLines.length > 0;

    const followUpLines = data.followUps
      .map((f) => `- Q: ${f.prompt}\n  A: ${f.answer}`)
      .join("\n");

    const prompt = `A person is describing symptoms. Assess them for triage. You are NOT diagnosing.

Main symptom (their words): ${data.mainSymptom}
Body area: ${data.bodyArea ?? "unspecified"}
Duration: ${data.duration ?? "unspecified"}
Severity: ${data.severity}/10
Other symptoms: ${data.additional.length ? data.additional.join(", ") : "none reported"}

Follow-up answers:
${followUpLines || "(none)"}

${usedProfile ? `Personal health context:\n${profileLines.join("\n")}` : "No personal health context provided."}

Return a JSON object with:
- urgency: "Low" (self-care / pharmacist), "Medium" (see GP within 24-48h), or "High" (urgent care / ED now).
- urgencyReasons: 1-3 short sentences citing the SPECIFIC answers that drove the urgency level.
- conditions: 2-4 plausible conditions, ranked by likelihood. For each:
  * name: short condition name
  * confidence: integer 10-90 (never 100 — this is triage, not diagnosis)
  * reasoning: one sentence starting "Because you said..." citing the specific answer(s) that support it.
- recommendedAction: one short sentence telling them what to do next.
- whenToSeekHelp: 2-4 concrete "seek care immediately if..." warning signs specific to their symptom.

Be specific to THIS person's answers. Do not give generic advice.`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: resultSchema }),
        prompt,
      });

      return {
        urgency: output.urgency,
        urgencyReasons: output.urgencyReasons.slice(0, 3),
        conditions: output.conditions
          .slice(0, 4)
          .map((c: { name: string; confidence: number; reasoning: string }) => ({
            name: c.name,
            confidence: Math.max(10, Math.min(90, Math.round(c.confidence))),
            reasoning: c.reasoning,
          })),
        recommendedAction: output.recommendedAction,
        whenToSeekHelp: output.whenToSeekHelp.slice(0, 4),
        usedProfile,
      };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("AI returned malformed output");
      }
      throw error;
    }
  });
