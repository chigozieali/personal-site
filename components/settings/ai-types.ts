export type RewriteInput = { text: string; label: string; multiline: boolean };

export type RewriteResponse = {
  ok: boolean;
  variants?: string[];
  error?: string;
};

/** Provided by the editor so a field can ask the assistant for a rewrite. */
export type RewriteRequest = (input: RewriteInput) => Promise<RewriteResponse>;

export type SkillTagDraft = { label: string; hot?: boolean };

export type SkillGroupDraft = { group: string; items: SkillTagDraft[] };
