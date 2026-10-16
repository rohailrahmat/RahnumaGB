import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensureSchema, getSql } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await params;
  await ensureSchema();
  const sql = getSql();
  const sessions = await sql`SELECT id, title, created_at FROM chat_sessions WHERE id = ${id} AND user_id = ${user.id} LIMIT 1`;
  if (!sessions.length) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  const messages = await sql`SELECT id, role, content, sources, created_at FROM chat_messages WHERE session_id = ${id} ORDER BY created_at ASC`;
  const parsedMessages = messages.map((message) => ({
    ...message,
    sources: JSON.parse(String(message.sources || "[]")),
  }));
  return NextResponse.json({ ...sessions[0], messages: parsedMessages });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await params;
  await ensureSchema();
  await getSql()`DELETE FROM chat_sessions WHERE id = ${id} AND user_id = ${user.id}`;
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({})) as { title?: string };
  const title = body.title?.trim().slice(0, 55);
  if (!title) return NextResponse.json({ error: "Add a conversation title." }, { status: 400 });
  await ensureSchema();
  await getSql()`UPDATE chat_sessions SET title = ${title}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id} AND user_id = ${user.id}`;
  return NextResponse.json({ ok: true });
}