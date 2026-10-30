"use client";

import { useState } from "react";
import { suggestSkillsAction } from "@/app/settings/ai-actions";
import type { SkillGroupDraft } from "./ai-types";

const keyOf = (group: string, label: string) => `${group}::${label}`;

/**
 * Asks the assistant for skill groups based on the saved CV, then lets the owner
 * tick the tags worth keeping. Only the ticked tags are written.
 */
export default function SkillsAi({
  enabled,
  onApply,
}: {
  enabled: boolean;
  onApply: (groups: SkillGroupDraft[]) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState(false);
  const [groups, setGroups] = useState<SkillGroupDraft[] | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  async function suggest() {
    setBusy(true);
    setError("");
    setGroups(null);
    try {
      const result = await suggestSkillsAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setGroups(result.data.groups);
      const next: Record<string, boolean> = {};
      for (const group of result.data.groups) {
        for (const tag of group.items) next[keyOf(group.group, tag.label)] = true;
      }
      setSelected(next);
    } catch {
      setError("The assistant could not answer.");
    } finally {
      setBusy(false);
    }
  }

  const chosen = (groups ?? [])
    .map((group) => ({
      group: group.group,
      items: group.items.filter((tag) => selected[keyOf(group.group, tag.label)]),
    }))
    .filter((group) => group.items.length > 0);

  const chosenCount = chosen.reduce((total, group) => total + group.items.length, 0);

  async function apply() {
    setApplying(true);
    setError("");
    try {
      await onApply(chosen);
      setGroups(null);
      setSelected({});
    } catch {
      setError("Could not add the suggestions.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="ai">
      <div className="ai-bar">
        <button
          className="ai-btn"
          type="button"
          disabled={!enabled || busy || applying}
          title={
            enabled
              ? "Suggest skill groups from the saved CV"
              : "Add GOOGLE_GENERATIVE_AI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY to enable AI"
          }
          onClick={suggest}
        >
          <span aria-hidden="true">✦</span>
          {busy ? "Reading your CV…" : groups ? "Suggest again" : "Suggest skills"}
        </button>
        {error ? <span className="ai-err">{error}</span> : null}
      </div>

      {groups ? (
        <div className="ai-panel">
          <h4>Tap to deselect, then add</h4>
          <div className="ai-groups">
            {groups.map((group) => (
              <div className="ai-group" key={group.group}>
                <h5>{group.group}</h5>
                <div className="ai-tags">
                  {group.items.map((tag) => {
                    const key = keyOf(group.group, tag.label);
                    const on = Boolean(selected[key]);
                    return (
                      <button
                        className={on ? "ai-tag on" : "ai-tag"}
                        type="button"
                        key={key}
                        aria-pressed={on}
                        onClick={() =>
                          setSelected((current) => ({ ...current, [key]: !current[key] }))
                        }
                      >
                        {tag.hot ? (
                          <span className="star" aria-hidden="true" title="Suggested highlight">
                            ★
                          </span>
                        ) : null}
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="st-actions">
            <button
              className="st-btn pri"
              type="button"
              disabled={applying || chosenCount === 0}
              onClick={apply}
            >
              {applying
                ? "Adding…"
                : chosenCount === 0
                  ? "Nothing selected"
                  : `Add ${chosenCount} tag${chosenCount === 1 ? "" : "s"}`}
            </button>
            <button
              className="st-btn"
              type="button"
              disabled={applying}
              onClick={() => {
                setGroups(null);
                setSelected({});
              }}
            >
              Discard
            </button>
            <span className="st-note">
              Tags go into the matching group, or into a new one.
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
