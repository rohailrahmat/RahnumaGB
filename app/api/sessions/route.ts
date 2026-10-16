import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensureSchema, getSql } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await ensureSchema();
  const sessions = await getSql()`SELECT id, title, created_at, updated_at FROM chat_sessions WHERE user_id = ${user.id} ORDER BY updated_at DESC LIMIT 50`;
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { title?: string };
  const id = randomUUID();
  const title = (body.title || "New journey").trim().slice(0, 55) || "New journey";
  await ensureSchema();
  await getSql()`INSERT INTO chat_sessions (id, user_id, title) VALUES (${id}, ${user.id}, ${title})`;
  return NextResponse.json({ id, title }, { status: 201 });
}