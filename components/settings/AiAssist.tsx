"use client";

import { useState } from "react";
import type { RewriteRequest } from "./ai-types";

/**
 * The "improve with AI" affordance under a text field. Suggestions are never applied
 * on their own: the owner has to pick one.
 */
export default function AiAssist({
  label,
  value,
  multiline,
  enabled,
  request,
  onApply,
}: {
  label: string;
  value: string;
  multiline: boolean;
  enabled: boolean;
  request: RewriteRequest;
  onApply: (next: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [variants, setVariants] = useState<string[] | null>(null);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    setVariants(null);
    try {
      const result = await request({ text: value, label, multiline });
      if (!result.ok) {
        setError(result.error ?? "The assistant could not answer.");
        return;
      }
      setVariants(result.variants ?? []);
    } catch {
      setError("The assistant could not answer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ai">
      <div className="ai-bar">
        <button
          className="ai-btn"
          type="button"
          disabled={!enabled || busy || value.trim() === ""}
          title={
            enabled
              ? "Ask for two rewrites of this field"
              : "Add GOOGLE_GENERATIVE_AI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY to enable AI"
          }
          onClick={run}
        >
          <span aria-hidden="true">✦</span>
          {busy ? "Writing…" : variants ? "Try again" : "Improve with AI"}
        </button>
        {error ? <span className="ai-err">{error}</span> : null}
      </div>

      {variants ? (
        <div className="ai-panel">
          <h4>Suggestions — nothing is saved until you pick one</h4>
          {variants.length === 0 ? (
            <p className="st-note">Nothing came back. Try again.</p>
          ) : null}
          {variants.map((variant, index) => (
            <div className="ai-variant" key={index}>
              <p>{variant}</p>
              <div className="st-actions">
                <button
                  className="st-btn mini pri"
                  type="button"
                  onClick={() => {
                    onApply(variant);
                    setVariants(null);
                  }}
                >
                  Use this
                </button>
              </div>
            </div>
          ))}
          <div className="st-actions">
            <button
              className="st-btn mini"
              type="button"
              onClick={() => setVariants(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
