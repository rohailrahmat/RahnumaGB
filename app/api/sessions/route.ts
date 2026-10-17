import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { ensureSchema, getSql } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    await ensureSchema();
    const sessions = await getSql()`SELECT id, title, created_at, updated_at FROM chat_sessions WHERE user_id = ${user.id} ORDER BY updated_at DESC LIMIT 50`;
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Conversation list could not be loaded:", error);
    return NextResponse.json({ error: "Conversation service is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const parsed = z.object({ title: z.string().trim().max(55).optional() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a conversation title of up to 55 characters." }, { status: 400 });
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const id = randomUUID();
    const title = parsed.data.title || "New journey";
    await ensureSchema();
    await getSql()`INSERT INTO chat_sessions (id, user_id, title) VALUES (${id}, ${user.id}, ${title})`;
    return NextResponse.json({ id, title }, { status: 201 });
  } catch (error) {
    console.error("Conversation could not be created:", error);
    return NextResponse.json({ error: "Conversation service is temporarily unavailable." }, { status: 503 });
  }
}