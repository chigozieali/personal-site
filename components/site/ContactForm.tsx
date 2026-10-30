"use client";

import { useEffect } from "react";
import { useForm, ValidationError } from "@formspree/react";

/* the public form id from https://formspree.io/f/mgaazdzn */
const FORM_ID = "mgaazdzn";
const RESET_DELAY = 3000;

export default function ContactForm({ email }: { email: string }) {
  const [state, handleSubmit] = useForm(FORM_ID);

  /* after a successful send, reload so the visitor gets a clean form back */
  useEffect(() => {
    if (!state.succeeded) return;
    const timeout = setTimeout(() => window.location.reload(), RESET_DELAY);
    return () => clearTimeout(timeout);
  }, [state.succeeded]);

  if (state.succeeded) {
    return (
      <div className="cform-done" role="status">
        <strong>Message sent.</strong>
        <p>Thanks — I&apos;ll reply by email shortly.</p>
      </div>
    );
  }

  const formErrors = state.errors?.getFormErrors() ?? [];

  return (
    <form className="cform" onSubmit={handleSubmit}>
      <div className="cform-row">
        <label>
          <span>Name</span>
          <input name="name" type="text" maxLength={100} autoComplete="name" />
        </label>
        <label>
          <span>Email</span>
          <input
            name="email"
            type="email"
            maxLength={200}
            autoComplete="email"
            required
          />
          <ValidationError
            className="cform-error"
            field="email"
            errors={state.errors}
          />
        </label>
      </div>
      <label>
        <span>Message</span>
        <textarea name="message" rows={4} maxLength={2000} />
        <ValidationError
          className="cform-error"
          field="message"
          errors={state.errors}
        />
      </label>
      <input
        className="cform-hp"
        name="_gotcha"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      {formErrors.map((error) => (
        <p className="cform-error" key={error.code}>
          {error.message}
        </p>
      ))}
      <div className="cform-foot">
        <button className="btn pri" type="submit" disabled={state.submitting}>
          {state.submitting ? "Sending…" : "Send message"}
        </button>
        <p className="cform-note" aria-live="polite">
          Prefer email? <a href={`mailto:${email}`}>{email}</a>
        </p>
      </div>
    </form>
  );
}
