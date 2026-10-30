"use client";

import { useEffect, useState } from "react";

const FORM_ENDPOINT = "https://formtorch.com/f/d0w1ed3wlm";
const RESET_DELAY = 5500;

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );

  useEffect(() => {
    if (status !== "success") return;
    const timeout = window.setTimeout(() => window.location.reload(), RESET_DELAY);
    return () => window.clearTimeout(timeout);
  }, [status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        body: new FormData(event.currentTarget),
      });
      setStatus(response.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="cform-done" role="status">
        <strong>Message sent.</strong>
        <p>Thanks — I&apos;ll reply by email shortly.</p>
      </div>
    );
  }

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
        </label>
      </div>
      <label>
        <span>Message</span>
        <textarea name="message" rows={4} maxLength={2000} />
      </label>
      <div className="cform-foot">
        <button className="btn pri" type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
      </div>
      {status === "error" ? (
        <p className="cform-error" role="alert">
          Could not send your message. Please try again.
        </p>
      ) : null}
    </form>
  );
}
