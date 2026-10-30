"use client";

import { useState } from "react";
import type { Field } from "@/lib/editor-spec";
import AiAssist from "./AiAssist";
import type { RewriteRequest } from "./ai-types";

export type Draft = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export default function Fields({
  fields,
  value,
  onChange,
  disabled,
  rewrite,
  aiEnabled = false,
}: {
  fields: Field[];
  value: Draft;
  onChange: (next: Draft) => void;
  disabled?: boolean;
  rewrite?: RewriteRequest;
  aiEnabled?: boolean;
}) {
  return (
    <div className="st-fields">
      {fields.map((field) => (
        <Control
          key={field.name}
          field={field}
          value={value[field.name]}
          onChange={(next) => onChange({ ...value, [field.name]: next })}
          disabled={disabled}
          rewrite={rewrite}
          aiEnabled={aiEnabled}
        />
      ))}
    </div>
  );
}

function Control({
  field,
  value,
  onChange,
  disabled,
  rewrite,
  aiEnabled = false,
}: {
  field: Field;
  value: unknown;
  onChange: (next: unknown) => void;
  disabled?: boolean;
  rewrite?: RewriteRequest;
  aiEnabled?: boolean;
}) {
  const wide = "wide" in field && field.wide;

  if (field.kind === "toggle") {
    return (
      <div className={"st-field" + (wide ? " wide" : "")}>
        <label>
          <input
            type="checkbox"
            checked={Boolean(value)}
            disabled={disabled}
            onChange={(event) => onChange(event.target.checked)}
            style={{ width: "auto", marginRight: 8 }}
          />
          {field.label}
        </label>
        {field.hint ? <span className="tip">{field.hint}</span> : null}
      </div>
    );
  }

  if (field.kind === "text" || field.kind === "textarea") {
    const common = {
      value: asString(value),
      placeholder: field.placeholder,
      disabled,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onChange(event.target.value),
    };
    return (
      <div className={"st-field" + (wide ? " wide" : "")}>
        <label>{field.label}</label>
        {field.kind === "text" ? (
          <input type="text" {...common} />
        ) : (
          <textarea {...common} />
        )}
        {field.hint ? <span className="tip">{field.hint}</span> : null}
        {field.kind === "textarea" && rewrite ? (
          <AiAssist
            label={field.label}
            value={asString(value)}
            multiline={false}
            enabled={aiEnabled}
            request={rewrite}
            onApply={(next) => onChange(next)}
          />
        ) : null}
      </div>
    );
  }

  if (field.kind === "lines") {
    const rows = asArray(value).map((entry) => String(entry));
    return (
      <div className={"st-field" + (wide ? " wide" : "")}>
        <label>{field.label}</label>
        <textarea
          value={rows.join("\n")}
          placeholder={field.placeholder}
          disabled={disabled}
          onChange={(event) =>
            onChange(event.target.value.split("\n").filter((line) => line !== ""))
          }
        />
        {field.hint ? <span className="tip">{field.hint}</span> : null}
        {rewrite ? (
          <AiAssist
            label={field.label}
            value={rows.join("\n")}
            multiline
            enabled={aiEnabled}
            request={rewrite}
            onApply={(next) =>
              onChange(next.split("\n").filter((line) => line.trim() !== ""))
            }
          />
        ) : null}
      </div>
    );
  }

  if (field.kind === "tags") {
    return (
      <StringTagList
        field={field}
        value={asArray(value).map(String)}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  if (field.kind === "pair") {
    const row = (value ?? {}) as Record<string, string>;
    return (
      <div className={"st-field" + (wide ? " wide" : "")}>
        <label>{field.label}</label>
        <div className="st-row">
          <input
            type="text"
            value={row[field.aKey] ?? ""}
            placeholder={field.aPlaceholder}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...row, [field.aKey]: event.target.value })
            }
          />
          <input
            type="text"
            value={row[field.bKey] ?? ""}
            placeholder={field.bPlaceholder}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...row, [field.bKey]: event.target.value })
            }
          />
        </div>
        {field.hint ? <span className="tip">{field.hint}</span> : null}
      </div>
    );
  }

  if (field.kind === "pairs") {
    const rows = asArray(value) as Record<string, string>[];
    return (
      <div className={"st-field" + (wide ? " wide" : "")}>
        <label>{field.label}</label>
        {rows.map((row, index) => (
          <div className="st-row" key={index}>
            <input
              type="text"
              value={row[field.aKey] ?? ""}
              placeholder={field.aPlaceholder}
              disabled={disabled}
              onChange={(event) =>
                onChange(
                  rows.map((entry, i) =>
                    i === index
                      ? { ...entry, [field.aKey]: event.target.value }
                      : entry,
                  ),
                )
              }
            />
            <input
              type="text"
              value={row[field.bKey] ?? ""}
              placeholder={field.bPlaceholder}
              disabled={disabled}
              onChange={(event) =>
                onChange(
                  rows.map((entry, i) =>
                    i === index
                      ? { ...entry, [field.bKey]: event.target.value }
                      : entry,
                  ),
                )
              }
            />
            <button
              className="st-btn mini danger"
              type="button"
              disabled={disabled}
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        ))}
        <div className="st-row">
          <button
            className="st-btn mini"
            type="button"
            disabled={disabled}
            onClick={() =>
              onChange([...rows, { [field.aKey]: "", [field.bKey]: "" }])
            }
          >
            Add
          </button>
        </div>
        {field.hint ? <span className="tip">{field.hint}</span> : null}
      </div>
    );
  }

  return (
    <TagList
      field={field}
      value={asArray(value) as { label: string; hot?: boolean }[]}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

function StringTagList({
  field,
  value,
  onChange,
  disabled,
}: {
  field: Extract<Field, { kind: "tags" }>;
  value: string[];
  onChange: (next: unknown) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const tag = draft.trim();
    if (!tag) return;
    onChange([...value, tag]);
    setDraft("");
  }

  return (
    <div className="st-field wide">
      <label>{field.label}</label>
      <div className="st-row">
        {value.map((tag, index) => (
          <span className="st-tag" key={`${tag}-${index}`}>
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              disabled={disabled}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="st-row">
        <input
          type="text"
          value={draft}
          placeholder="Type a tag and press Enter"
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <button className="st-btn mini" type="button" disabled={disabled} onClick={add}>
          Add
        </button>
      </div>
      {field.hint ? <span className="tip">{field.hint}</span> : null}
    </div>
  );
}

function TagList({
  field,
  value,
  onChange,
  disabled,
}: {
  field: Extract<Field, { kind: "taglist" }>;
  value: { label: string; hot?: boolean }[];
  onChange: (next: unknown) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const label = draft.trim();
    if (!label) return;
    onChange([...value, { label }]);
    setDraft("");
  }

  return (
    <div className="st-field wide">
      <label>{field.label}</label>
      <div className="st-row">
        {value.map((tag, index) => (
          <span className={tag.hot ? "st-tag on" : "st-tag"} key={index}>
            <button
              type="button"
              title="Toggle highlight"
              disabled={disabled}
              onClick={() =>
                onChange(
                  value.map((entry, i) =>
                    i === index ? { ...entry, hot: !entry.hot } : entry,
                  ),
                )
              }
            >
              {tag.label}
            </button>
            <button
              type="button"
              aria-label={`Remove ${tag.label}`}
              disabled={disabled}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="st-row">
        <input
          type="text"
          value={draft}
          placeholder="Type a tag and press Enter"
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <button className="st-btn mini" type="button" disabled={disabled} onClick={add}>
          Add
        </button>
      </div>
      {field.hint ? <span className="tip">{field.hint}</span> : null}
    </div>
  );
}
