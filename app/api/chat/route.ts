import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { ensureSchema, getSql } from "@/lib/db";
import { answerTravelQuestion } from "@/lib/rag";
import type { ChatMessage } from "@/lib/types";

export const maxDuration = 60;

const chatSchema = z.object({ q: z.string().trim().min(1).max(2000), session_id: z.string().optional() });

export async function POST(request: Request) {
  const parsed = chatSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a question to continue." }, { status: 400 });

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in to start a conversation." }, { status: 401 });
    await ensureSchema();
    const sql = getSql();
    const { q, session_id: requestedSession } = parsed.data;
    let sessionId = requestedSession;
    let history: ChatMessage[] = [];

    if (sessionId) {
      const owned = await sql`SELECT id FROM chat_sessions WHERE id = ${sessionId} AND user_id = ${user.id} LIMIT 1`;
      if (!owned.length) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
      const messages = await sql`SELECT role, content FROM chat_messages WHERE session_id = ${sessionId} ORDER BY created_at DESC LIMIT 40`;
      history = messages.reverse().map((message) => ({ role: message.role as ChatMessage["role"], content: String(message.content) }));
    }

    const result = await answerTravelQuestion(q, history);
    if (!sessionId) {
      sessionId = randomUUID();
      await sql`INSERT INTO chat_sessions (id, user_id, title) VALUES (${sessionId}, ${user.id}, ${q.slice(0, 55)})`;
    }

    await sql`INSERT INTO chat_messages (id, session_id, role, content, sources) VALUES (${randomUUID()}, ${sessionId}, 'user', ${q}, '[]')`;
    await sql`INSERT INTO chat_messages (id, session_id, role, content, sources) VALUES (${randomUUID()}, ${sessionId}, 'assistant', ${result.text}, ${JSON.stringify(result.sources)})`;
    await sql`UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ${sessionId}`;
    return NextResponse.json({ ...result, session_id: sessionId });
  } catch (error) {
    console.error("Chat request failed:", error);
    return NextResponse.json({ error: "The assistant is temporarily unavailable. Please try again later." }, { status: 503 });
  }
}