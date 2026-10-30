"use server";

import { isAuthenticated } from "@/lib/auth";
import { getSiteContentFresh } from "@/lib/content";
import {
  hasAiConfigured,
  rewriteText,
  suggestSkills,
  type SkillSuggestions,
} from "@/lib/ai";
import type { SiteContent } from "@/lib/types";

export type AiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const WINDOW_MS = 60 * 60 * 1000;
const MAX_CALLS = 40;
const MAX_TEXT = 4000;

/**
 * Best effort throttle. Serverless instances are short lived, so this only stops a
 * runaway loop in one instance; it is not a security boundary.
 */
const calls: number[] = [];

function throttled(): boolean {
  const now = Date.now();
  while (calls.length > 0 && now - calls[0] > WINDOW_MS) calls.shift();
  if (calls.length >= MAX_CALLS) return true;
  calls.push(now);
  return false;
}

async function guard(): Promise<string | null> {
  if (!(await isAuthenticated())) return "Your session expired. Sign in again.";
  if (!hasAiConfigured()) {
    return "AI is not configured. Add a free Google AI Studio key as GOOGLE_GENERATIVE_AI_API_KEY.";
  }
  if (throttled()) return "Too many AI requests in the last hour. Try again later.";
  return null;
}

function clip(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

/** A short, cheap summary of the saved site, used as context for both prompts. */
function summarize(content: SiteContent): string {
  const { settings, items } = content;
  const lines: string[] = [
    `Name: ${settings.profile.name}`,
    `Tagline: ${settings.profile.tagline}`,
    `Current role: ${settings.profile.currentRole}`,
    `Moving into: ${settings.profile.movingInto}`,
    `Location: ${settings.profile.location}`,
    `Availability: ${settings.profile.availability}`,
  ];

  if (items.experience.length > 0) {
    lines.push(
      "Experience:",
      ...items.experience.map(
        (entry) =>
          `- ${entry.when} ${entry.title}${entry.sub ? ` (${entry.sub})` : ""}: ${entry.bullets.join(" ")}`,
      ),
    );
  }

  if (items.projects.length > 0) {
    lines.push(
      "Projects:",
      ...items.projects.map(
        (entry) =>
          `- ${entry.title}${entry.type ? ` [${entry.type}]` : ""}: ${entry.desc} (${entry.tags.join(", ")})`,
      ),
    );
  }

  if (items.certificates.length > 0) {
    lines.push(
      "Certificates:",
      ...items.certificates.map((entry) => `- ${entry.title}, ${entry.issuer}`),
    );
  }

  if (items.roadmap.length > 0) {
    lines.push(
      "Planned certifications:",
      ...items.roadmap.map((entry) => `- ${entry.code} ${entry.title} (${entry.status})`),
    );
  }

  return clip(lines.join("\n"), MAX_TEXT);
}

export async function suggestSkillsAction(): Promise<AiResult<SkillSuggestions>> {
  const denied = await guard();
  if (denied) return { ok: false, error: denied };

  try {
    const content = await getSiteContentFresh();
    const existing = content.items.skills
      .map((group) => `${group.group}: ${group.items.map((tag) => tag.label).join(", ")}`)
      .join("\n");

    const context = `${summarize(content)}

Existing skill groups (do not repeat these tags):
${existing || "(none yet)"}`;

    return { ok: true, data: await suggestSkills(context) };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "The assistant could not answer. Try again in a moment." };
  }
}

export async function rewriteTextAction(input: {
  text: string;
  label: string;
  multiline: boolean;
}): Promise<AiResult<{ variants: string[] }>> {
  const denied = await guard();
  if (denied) return { ok: false, error: denied };

  const text = typeof input.text === "string" ? input.text.trim() : "";
  if (text === "") return { ok: false, error: "There is nothing to rewrite yet." };

  try {
    const content = await getSiteContentFresh();
    const variants = await rewriteText({
      text: clip(text, MAX_TEXT),
      label: clip(String(input.label ?? "Text"), 120),
      multiline: Boolean(input.multiline),
      context: summarize(content),
    });

    if (variants.length === 0) {
      return { ok: false, error: "The assistant returned nothing usable. Try again." };
    }
    return { ok: true, data: { variants } };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "The assistant could not answer. Try again in a moment." };
  }
}
