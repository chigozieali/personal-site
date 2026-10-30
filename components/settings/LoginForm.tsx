"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/settings/actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {
    error: null,
  });

  return (
    <div className="st-login">
      <div className="st-card">
        <h1>Site settings</h1>
        <p>Enter the settings password to edit the site.</p>
        <form action={formAction}>
          <div className="st-field wide">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
            />
          </div>
          {state.error ? <p className="st-msg err">{state.error}</p> : null}
          <div className="st-actions">
            <button className="st-btn pri" type="submit" disabled={pending}>
              {pending ? "Checking…" : "Sign in"}
            </button>
            <span className="sp" />
            <Link className="st-btn" href="/">
              Back to site
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
