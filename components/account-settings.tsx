"use client";

import { FormEvent, useState } from "react";
import { Bell, CalendarDays, Check, LoaderCircle, ShieldCheck, UserRound } from "lucide-react";

type AccountState = {
  name: string;
  email: string;
  createdAt: string;
};

type Preferences = {
  tripUpdates: boolean;
  safetyAlerts: boolean;
};

export function AccountSettings({ initialUser, initialPreferences }: { initialUser: AccountState; initialPreferences: Preferences }) {
  const [name, setName] = useState(initialUser.name);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ...preferences }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Your settings could not be saved.");
      setName(payload.user.name);
      setPreferences(payload.preferences);
      setNotice("Your profile and preferences are saved.");
      window.dispatchEvent(new Event("rehnuma-auth-change"));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Your settings could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="account-settings" onSubmit={save}>
      <section className="account-card">
        <div className="account-card-heading">
          <span className="account-card-icon"><UserRound size={19} /></span>
          <div><h2>Personal details</h2><p>How your account appears across Rahnuma.</p></div>
        </div>
        <label className="account-field">Your name
          <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required />
        </label>
        <label className="account-field">Email address
          <input value={initialUser.email} type="email" readOnly />
          <small>Email address changes are not available here.</small>
        </label>
        <div className="account-member-since"><CalendarDays size={15} /> Member since {new Date(initialUser.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" })}</div>
      </section>

      <section className="account-card">
        <div className="account-card-heading">
          <span className="account-card-icon"><Bell size={19} /></span>
          <div><h2>Travel notifications</h2><p>Choose the updates you’d like to receive.</p></div>
        </div>
        <label className="account-preference">
          <span><strong>Trip and route updates</strong><small>Helpful changes and reminders for your saved journeys.</small></span>
          <input type="checkbox" checked={preferences.tripUpdates} onChange={(event) => setPreferences({ ...preferences, tripUpdates: event.target.checked })} />
        </label>
        <label className="account-preference">
          <span><strong>Safety and travel advisories</strong><small>Important guidance when planning travel around the region.</small></span>
          <input type="checkbox" checked={preferences.safetyAlerts} onChange={(event) => setPreferences({ ...preferences, safetyAlerts: event.target.checked })} />
        </label>
        <p className="account-preference-note"><ShieldCheck size={15} /> Preferences are saved to your account. Rahnuma does not send notification emails yet.</p>
      </section>

      <div className="account-save-row">
        {error && <p className="form-error" role="alert">{error}</p>}
        {notice && <p className="account-save-success" role="status"><Check size={15} /> {notice}</p>}
        <button className="button button-dark" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : "Save changes"}</button>
      </div>
    </form>
  );
}
