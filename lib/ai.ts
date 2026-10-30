import { generateText, Output, type LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

type ProviderName = "google" | "groq" | "openai";

type Provider = {
  name: ProviderName;
  /** Shown in the editor so it is obvious which service is being used. */
  label: string;
  /** Default model. AI_MODEL overrides it. */
  model: string;
  /** Environment variable that turns this provider on. */
  key: string;
};

/**
 * Checked in order. The first provider with a key wins, so a free Google AI Studio
 * key takes priority over a paid OpenAI one.
 */
const PROVIDERS: Provider[] = [
  {
    name: "google",
    label: "Gemini",
    model: "gemini-3.8-flash",
    key: "GOOGLE_GENERATIVE_AI_API_KEY",
  },
  {
    name: "groq",
    label: "Groq",
    model: "llama-3.3-70b-versatile",
    key: "GROQ_API_KEY",
  },
  {
    name: "openai",
    label: "OpenAI",
    model: "gpt-6-luna",
    key: "OPENAI_API_KEY",
  },
];

function activeProvider(): Provider | null {
  return (
    PROVIDERS.find((provider) => Boolean(process.env[provider.key]?.trim())) ?? null
  );
}

export function hasAiConfigured(): boolean {
  return activeProvider() !== null;
}

/** "Gemini", "Groq", "OpenAI", or null when nothing is configured. */
export function aiProviderLabel(): string | null {
  return activeProvider()?.label ?? null;
}

export function aiModelId(): string | null {
  const provider = activeProvider();
  if (!provider) return null;
  return process.env.AI_MODEL?.trim() || provider.model;
}

/**
 * Builds the model for whichever provider is configured. AI_BASE_URL is an optional
 * escape hatch for a proxy or gateway; all three providers accept one.
 */
function model(): LanguageModel {
  const provider = activeProvider();
  if (!provider) throw new Error("No AI provider is configured.");

  const baseURL = process.env.AI_BASE_URL?.trim() || undefined;
  const options = baseURL ? { baseURL } : {};
  const id = aiModelId() ?? provider.model;

  switch (provider.name) {
    case "google":
      return createGoogleGenerativeAI(options)(id);
    case "groq":
      return createGroq(options)(id);
    case "openai":
      return createOpenAI(options)(id);
  }
}

/**
 * Shared voice rules. The "never invent" rule is the important one: this is a CV, so
 * a made up certification or metric is worse than no suggestion at all.
 */
const VOICE = `You are helping edit a one page CV site. The owner is an IT support professional in Port Harcourt, Nigeria, moving into cloud engineering.

Rules:
- First person, plain and concrete. No marketing buzzwords, no exclamation marks, no em dashes.
- Keep the owner's **bold** markers exactly as written.
- Never invent employers, dates, numbers, certifications, tools or achievements. Only use facts present in the material you are given.
- If something important is missing, write the literal marker [TODO] instead of guessing.
- American spelling.`;

const SkillsSchema = z.object({
  groups: z.array(
    z.object({
      group: z
        .string()
        .describe("Short category name, for example Cloud, Networking, Endpoint"),
      items: z.array(
        z.object({
          label: z.string().describe("A concrete skill, tool or platform name"),
          hot: z
            .boolean()
            .describe(
              "true for at most two per group: the ones most relevant to the target role",
            ),
        }),
      ),
    }),
  ),
});

export type SkillSuggestions = z.infer<typeof SkillsSchema>;

/** Asks for skill groups that are supported by the material in `context`. */
export async function suggestSkills(context: string): Promise<SkillSuggestions> {
  const { output } = await generateText({
    model: model(),
    output: Output.object({ schema: SkillsSchema }),
    system: `${VOICE}

You are filling in the Skills section. Propose 3 to 5 groups with 4 to 8 tags each. Only include skills that are evidenced by the material given. Prefer concrete tool and platform names over vague phrases. Do not repeat tags that already exist.`,
    prompt: context,
  });

  return output;
}

const RewriteSchema = z.object({
  variants: z.array(z.string()).describe("Two rewrites of the same text"),
});

export type RewriteSuggestions = z.infer<typeof RewriteSchema>;

export type RewriteInput = {
  text: string;
  label: string;
  multiline: boolean;
  context: string;
};

/** Asks for two rewrites of a single field. */
export async function rewriteText(input: RewriteInput): Promise<string[]> {
  const shape = input.multiline
    ? "Return one item per line, with no bullet characters or numbering."
    : "Return a single paragraph.";

  const { output } = await generateText({
    model: model(),
    output: Output.object({ schema: RewriteSchema }),
    system: `${VOICE}

Rewrite the field you are given. Return exactly 2 variants: one tighter, one slightly warmer. Keep every fact identical and the length roughly the same. ${shape} Plain text only.`,
    prompt: `Field: ${input.label}

What the site already says about the owner:
${input.context}

Text to rewrite:
${input.text}`,
  });

  return output.variants
    .map((variant) => variant.trim())
    .filter((variant) => variant !== "")
    .slice(0, 2);
}
