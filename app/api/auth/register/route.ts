import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureSchema, getSql } from "@/lib/db";

const registrationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const parsed = registrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a name, valid email and password of at least 8 characters." }, { status: 400 });

  try {
    await ensureSchema();
    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();
    const existing = await getSql()`SELECT id FROM app_users WHERE email = ${normalizedEmail} LIMIT 1`;
    if (existing.length) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

    const id = randomUUID();
    const passwordHash = await hash(password, 12);
    await getSql()`INSERT INTO app_users (id, name, email, password_hash) VALUES (${id}, ${name}, ${normalizedEmail}, ${passwordHash})`;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json({ error: "Registration is temporarily unavailable. Please try again later." }, { status: 503 });
  }
}