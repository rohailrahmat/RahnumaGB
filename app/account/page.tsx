import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { AccountSettings } from "@/components/account-settings";
import { getCurrentUser } from "@/lib/auth";
import { ensureSchema, getSql } from "@/lib/db";

export const metadata: Metadata = {
  title: "Account settings | Rahnuma GB",
  description: "Manage your Rahnuma profile and travel notification preferences.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await ensureSchema();
  await getSql()`INSERT INTO user_preferences (user_id) VALUES (${String(user.id)}) ON CONFLICT(user_id) DO NOTHING`;
  const rows = await getSql()`SELECT trip_updates, safety_alerts FROM user_preferences WHERE user_id = ${String(user.id)} LIMIT 1`;

  return (
    <>
      <SiteHeader />
      <main className="account-page">
        <section className="account-heading page-width">
          <span className="eyebrow">YOUR RAHNUMA ACCOUNT</span>
          <h1>Your profile.<br /><em>Your way north.</em></h1>
          <p>Keep your details and travel preferences up to date.</p>
        </section>
        <div className="page-width">
          <AccountSettings initialUser={{
            name: String(user.name),
            email: String(user.email),
            createdAt: String(user.created_at),
          }} initialPreferences={{
            tripUpdates: Boolean(rows[0]?.trip_updates),
            safetyAlerts: Boolean(rows[0]?.safety_alerts),
          }} />
        </div>
      </main>
    </>
  );
}
