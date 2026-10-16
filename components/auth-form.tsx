"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password") }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => ({}));
    if (!response?.ok) {
      setError(payload?.error || "We couldn’t connect just now. Try again.");
      setBusy(false);
      return;
    }
    window.dispatchEvent(new Event("rehnuma-auth-change"));
    window.location.assign("/assistant");
  }

  return <form className="auth-form" onSubmit={submit}>
    {error && <p className="form-error" role="alert">{error}</p>}
    {isRegister && <label>Your name<input name="name" autoComplete="name" minLength={2} maxLength={80} placeholder="Full name" required /></label>}
    <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
    <label>Password<input name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength={isRegister ? 8 : undefined} placeholder={isRegister ? "At least 8 characters" : "Your password"} required /></label>
    <button className="button button-dark auth-submit" disabled={busy} type="submit">{busy ? <LoaderCircle className="spin" size={16} /> : isRegister ? "Create your account" : "Sign in"}<ArrowRight size={16} /></button>
    <p className="auth-terms">By continuing, you agree to travel thoughtfully and respect local communities.</p>
  </form>;
}