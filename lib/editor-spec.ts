import type { CollectionKey, SettingKey } from "./types";

export type Field =
  | {
      kind: "text";
      name: string;
      label: string;
      wide?: boolean;
      placeholder?: string;
      hint?: string;
    }
  | {
      kind: "textarea";
      name: string;
      label: string;
      wide?: boolean;
      placeholder?: string;
      hint?: string;
    }
  | {
      kind: "lines";
      name: string;
      label: string;
      wide?: boolean;
      placeholder?: string;
      hint?: string;
    }
  | {
      kind: "tags";
      name: string;
      label: string;
      wide?: boolean;
      placeholder?: string;
      hint?: string;
    }
  | { kind: "toggle"; name: string; label: string; hint?: string }
  | {
      kind: "pair";
      name: string;
      label: string;
      wide?: boolean;
      hint?: string;
      aKey: string;
      bKey: string;
      aLabel: string;
      bLabel: string;
      aPlaceholder?: string;
      bPlaceholder?: string;
    }
  | {
      kind: "pairs";
      name: string;
      label: string;
      wide?: boolean;
      hint?: string;
      aKey: string;
      bKey: string;
      aLabel: string;
      bLabel: string;
      aPlaceholder?: string;
      bPlaceholder?: string;
    }
  | { kind: "taglist"; name: string; label: string; wide?: boolean; hint?: string };

export type CollectionSpec = {
  key: CollectionKey;
  label: string;
  fields: Field[];
  summary: (item: Record<string, unknown>) => string;
  blank: () => Record<string, unknown>;
};

export type SettingSpec = {
  key: SettingKey;
  label: string;
  fields: Field[];
};

const text = (
  name: string,
  label: string,
  extra: Partial<Extract<Field, { kind: "text" }>> = {},
): Field => ({ kind: "text", name, label, ...extra });

const area = (
  name: string,
  label: string,
  extra: Partial<Extract<Field, { kind: "textarea" }>> = {},
): Field => ({ kind: "textarea", name, label, ...extra });

const lines = (
  name: string,
  label: string,
  extra: Partial<Extract<Field, { kind: "lines" }>> = {},
): Field => ({ kind: "lines", name, label, ...extra });

const tags = (
  name: string,
  label: string,
  extra: Partial<Extract<Field, { kind: "tags" }>> = {},
): Field => ({ kind: "tags", name, label, ...extra });

const toggle = (name: string, label: string, hint?: string): Field => ({
  kind: "toggle",
  name,
  label,
  hint,
});

export const COLLECTION_SPECS: Record<CollectionKey, CollectionSpec> = {
  now: {
    key: "now",
    label: "Right now",
    fields: [
      text("heading", "Heading"),
      lines("bullets", "Bullets", { wide: true, hint: "One bullet per line." }),
      text("updated", "Updated label", { placeholder: "Updated October 2026" }),
    ],
    summary: (item) => String(item.heading ?? "Right now"),
    blank: () => ({ heading: "Right now", bullets: [], updated: "" }),
  },
  stats: {
    key: "stats",
    label: "Stats",
    fields: [
      text("value", "Value", { placeholder: "5+" }),
      text("label", "Label", { placeholder: "Years in IT support" }),
    ],
    summary: (item) => `${String(item.value ?? "")} ${String(item.label ?? "")}`.trim(),
    blank: () => ({ value: "", label: "" }),
  },
  experience: {
    key: "experience",
    label: "Experience",
    fields: [
      text("when", "Date", { placeholder: "5+ years" }),
      text("title", "Role"),
      text("sub", "Subtitle", { wide: true }),
      lines("bullets", "Bullets", {
        wide: true,
        hint: "One per line. Wrap words in **double asterisks** to bold them.",
      }),
      toggle("upcoming", "Mark as target role", "Shows the “(target)” tag."),
    ],
    summary: (item) => String(item.title ?? "New role"),
    blank: () => ({ when: "", title: "", sub: "", bullets: [], upcoming: false }),
  },
  services: {
    key: "services",
    label: "Services",
    fields: [
      text("title", "Title"),
      area("desc", "Description", { wide: true }),
      lines("bullets", "Bullet points", { wide: true, hint: "One per line." }),
    ],
    summary: (item) => String(item.title ?? "New service"),
    blank: () => ({ title: "", desc: "", bullets: [] }),
  },
  skills: {
    key: "skills",
    label: "Skills",
    fields: [
      text("group", "Group", { placeholder: "Cloud" }),
      {
        kind: "taglist",
        name: "items",
        label: "Tags",
        wide: true,
        hint: "Click a tag to mark it as highlighted.",
      },
    ],
    summary: (item) => String(item.group ?? "New group"),
    blank: () => ({ group: "", items: [] }),
  },
  certificates: {
    key: "certificates",
    label: "Certificates",
    fields: [
      text("title", "Title"),
      text("issuer", "Issuer", { placeholder: "Google" }),
      area("desc", "Description", { wide: true }),
    ],
    summary: (item) => String(item.title ?? "New certificate"),
    blank: () => ({ title: "", issuer: "", desc: "" }),
  },
  roadmap: {
    key: "roadmap",
    label: "Roadmap",
    fields: [
      text("code", "Code", { placeholder: "AZ-104" }),
      text("title", "Title"),
      text("status", "Status", { placeholder: "Next target" }),
      toggle("active", "Highlight this one"),
    ],
    summary: (item) => `${String(item.code ?? "")} ${String(item.title ?? "")}`.trim(),
    blank: () => ({ code: "", title: "", status: "", active: false }),
  },
  projects: {
    key: "projects",
    label: "Projects",
    fields: [
      text("category", "Category", {
        placeholder: "Cloud",
        hint: "Projects with the same category are grouped together. Enter a new name to create or move a project.",
      }),
      text("date", "Date", { placeholder: "Apr 2026" }),
      text("type", "Type", { placeholder: "Azure" }),
      text("title", "Title", { wide: true }),
      area("desc", "Description", { wide: true }),
      tags("tags", "Tags", {
        wide: true,
        hint: "Add tags one at a time.",
      }),
      text("link", "Link URL", { wide: true, placeholder: "https://github.com/..." }),
      text("linkLabel", "Link label", { placeholder: "GitHub ↗" }),
      text("privateNote", "Private note", {
        wide: true,
        hint: "Shown instead of a link, for example: Runs at home",
      }),
    ],
    summary: (item) => String(item.title ?? "New project"),
    blank: () => ({
      category: "Other",
      date: "",
      type: "",
      title: "",
      desc: "",
      tags: [],
      link: "",
      linkLabel: "",
      privateNote: "",
    }),
  },
};

export const SETTING_SPECS: Record<SettingKey, SettingSpec> = {  profile: {
    key: "profile",
    label: "Profile",
    fields: [
      text("name", "Name"),
      text("initials", "Initials", { placeholder: "CA" }),
      text("tagline", "Tagline", {
        wide: true,
        placeholder: "IT Support → Cloud Engineer",
      }),
      text("location", "Location"),
      text("email", "Email"),
      text("phone", "Phone"),
      text("availability", "Availability", { placeholder: "Remote, worldwide" }),
      text("currentRole", "Current role"),
      text("movingInto", "Moving into"),
      {
        kind: "pairs",
        name: "socials",
        label: "Social links",
        wide: true,
        hint: "Label and URL for each link.",
        aKey: "label",
        bKey: "href",
        aLabel: "Label",
        bLabel: "URL",
        aPlaceholder: "LinkedIn ↗",
        bPlaceholder: "https://linkedin.com/in/...",
      },
    ],
  },
  hero: {
    key: "hero",
    label: "Hero",
    fields: [
      text("headlineBefore", "Headline, first part", {
        wide: true,
        placeholder: "From the helpdesk to the",
      }),
      text("headlineHighlight", "Headline, highlighted word", {
        wide: true,
        placeholder: "cloud.",
      }),
      area("lead", "Lead paragraph", {
        wide: true,
        hint: "Wrap words in **double asterisks** to bold them.",
      }),
      lines("typedWords", "Typing line phrases", {
        wide: true,
        hint: "One phrase per line. They cycle under the lead paragraph.",
      }),
      {
        kind: "pair",
        name: "primaryCta",
        label: "Primary button",
        wide: true,
        aKey: "label",
        bKey: "href",
        aLabel: "Label",
        bLabel: "Link",
        aPlaceholder: "See my projects",
        bPlaceholder: "#projects",
      },
      {
        kind: "pair",
        name: "secondaryCta",
        label: "Secondary button",
        wide: true,
        aKey: "label",
        bKey: "href",
        aLabel: "Label",
        bLabel: "Link",
        aPlaceholder: "Get in touch",
        bPlaceholder: "#contact",
      },
    ],
  },
  about: {
    key: "about",
    label: "About",
    fields: [
      lines("paragraphs", "Paragraphs", {
        wide: true,
        hint: "One paragraph per line. Wrap words in **double asterisks** to bold them.",
      }),
      {
        kind: "pairs",
        name: "facts",
        label: "Quick facts",
        wide: true,
        aKey: "label",
        bKey: "value",
        aLabel: "Label",
        bLabel: "Value",
        aPlaceholder: "Based in",
        bPlaceholder: "Port Harcourt, Nigeria",
      },
    ],
  },
  servicesCta: {
    key: "servicesCta",
    label: "Services call to action",
    fields: [
      text("text", "Text", { wide: true }),
      text("label", "Button label", { wide: true }),
    ],
  },
  contact: {
    key: "contact",
    label: "Contact",
    fields: [
      text("heading", "Heading", { wide: true }),
      area("text", "Paragraph", { wide: true }),
    ],
  },
  meta: {
    key: "meta",
    label: "Site & footer",
    fields: [
      text("title", "Page title", { wide: true }),
      area("description", "Meta description", {
        wide: true,
        hint: "Used by search engines and link previews.",
      }),
      text("footerText", "Footer text", { wide: true }),
      text("footerLocation", "Footer location", { wide: true }),
    ],
  },
};

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Cleans a draft value before it is written to the database. */
export function normalizeValue(field: Field, value: unknown): unknown {
  switch (field.kind) {
    case "text":
    case "textarea":
      return trim(value);
    case "lines":
      return asArray(value).map(trim).filter((entry) => entry !== "");
    case "tags":
      return asArray(value).map(trim).filter((entry) => entry !== "");
    case "toggle":
      return Boolean(value);
    case "pair": {
      const row = (value ?? {}) as Record<string, unknown>;
      return {
        [field.aKey]: trim(row[field.aKey]),
        [field.bKey]: trim(row[field.bKey]),
      };
    }
    case "pairs":
      return asArray(value)
        .map((entry) => {
          const row = entry as Record<string, unknown>;
          return {
            [field.aKey]: trim(row[field.aKey]),
            [field.bKey]: trim(row[field.bKey]),
          };
        })
        .filter((row) => row[field.aKey] !== "" || row[field.bKey] !== "");
    case "taglist":
      return asArray(value)
        .map((entry) => {
          const tag = entry as { label?: unknown; hot?: unknown };
          return { label: trim(tag.label), hot: Boolean(tag.hot) };
        })
        .filter((tag) => tag.label !== "");
    default:
      return value;
  }
}

/** Normalizes a whole draft object against a list of fields. */
export function normalizeDraft(
  fields: Field[],
  draft: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...draft };
  for (const field of fields) {
    out[field.name] = normalizeValue(field, draft[field.name]);
  }
  return out;
}
