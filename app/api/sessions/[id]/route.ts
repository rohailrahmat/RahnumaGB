import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { ensureSchema, getSql } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const { id } = await params;
    await ensureSchema();
    const sql = getSql();
    const sessions = await sql`SELECT id, title, created_at FROM chat_sessions WHERE id = ${id} AND user_id = ${user.id} LIMIT 1`;
    if (!sessions.length) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    const messages = await sql`SELECT id, role, content, sources, created_at FROM chat_messages WHERE session_id = ${id} ORDER BY created_at DESC LIMIT 200`;
    const parsedMessages = messages.reverse().map((message) => ({
      ...message,
      sources: JSON.parse(String(message.sources || "[]")),
    }));
    return NextResponse.json({ ...sessions[0], messages: parsedMessages });
  } catch (error) {
    console.error("Conversation could not be loaded:", error);
    return NextResponse.json({ error: "Conversation service is temporarily unavailable." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const { id } = await params;
    await ensureSchema();
    await getSql()`DELETE FROM chat_sessions WHERE id = ${id} AND user_id = ${user.id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Conversation could not be deleted:", error);
    return NextResponse.json({ error: "Conversation service is temporarily unavailable." }, { status: 503 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const parsed = z.object({ title: z.string().trim().min(1).max(55) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Add a conversation title of up to 55 characters." }, { status: 400 });
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const { id } = await params;
    await ensureSchema();
    await getSql()`UPDATE chat_sessions SET title = ${parsed.data.title}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id} AND user_id = ${user.id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Conversation could not be renamed:", error);
    return NextResponse.json({ error: "Conversation service is temporarily unavailable." }, { status: 503 });
  }
}