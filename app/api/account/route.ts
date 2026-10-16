import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { ensureSchema, getSql } from "@/lib/db";

const accountUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  tripUpdates: z.boolean().optional(),
  safetyAlerts: z.boolean().optional(),
}).refine((value) => Object.values(value).some((entry) => entry !== undefined));

async function getPreferences(userId: string) {
  await getSql()`INSERT OR IGNORE INTO user_preferences (user_id) VALUES (${userId})`;
  const rows = await getSql()`SELECT trip_updates, safety_alerts FROM user_preferences WHERE user_id = ${userId} LIMIT 1`;
  return {
    tripUpdates: Boolean(rows[0]?.trip_updates),
    safetyAlerts: Boolean(rows[0]?.safety_alerts),
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in to view your account." }, { status: 401 });
    await ensureSchema();
    const preferences = await getPreferences(String(user.id));
    return NextResponse.json({ user, preferences });
  } catch (error) {
    console.error("Account details could not be loaded:", error);
    return NextResponse.json({ error: "Account details could not be loaded." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to update your account." }, { status: 401 });

  const parsed = accountUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check your name and notification preferences." }, { status: 400 });

  try {
    await ensureSchema();
    const userId = String(user.id);
    const { name, tripUpdates, safetyAlerts } = parsed.data;
    if (name !== undefined) await getSql()`UPDATE app_users SET name = ${name} WHERE id = ${userId}`;
    if (tripUpdates !== undefined || safetyAlerts !== undefined) {
      const current = await getPreferences(userId);
      const nextTripUpdates = tripUpdates ?? current.tripUpdates;
      const nextSafetyAlerts = safetyAlerts ?? current.safetyAlerts;
      await getSql()`INSERT INTO user_preferences (user_id, trip_updates, safety_alerts)
        VALUES (${userId}, ${nextTripUpdates ? 1 : 0}, ${nextSafetyAlerts ? 1 : 0})
        ON CONFLICT(user_id) DO UPDATE SET trip_updates = excluded.trip_updates, safety_alerts = excluded.safety_alerts`;
    }
    const updatedUsers = await getSql()`SELECT id, name, email, created_at FROM app_users WHERE id = ${userId} LIMIT 1`;
    return NextResponse.json({ user: updatedUsers[0], preferences: await getPreferences(userId) });
  } catch (error) {
    console.error("Account update failed:", error);
    return NextResponse.json({ error: "Your account could not be updated. Please try again." }, { status: 503 });
  }
}
