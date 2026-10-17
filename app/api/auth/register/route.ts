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
    const id = randomUUID();
    const passwordHash = await hash(password, 12);
    const inserted = await getSql()`INSERT INTO app_users (id, name, email, password_hash)
      VALUES (${id}, ${name}, ${normalizedEmail}, ${passwordHash})
      ON CONFLICT(email) DO NOTHING
      RETURNING id`;
    if (!inserted.length) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Registration failed:", error);
    if (error instanceof Error && error.message.includes("Set DATABASE_URL")) {
      return NextResponse.json({ error: "Account storage is not configured. Add DATABASE_URL in the Vercel project environment and redeploy." }, { status: 503 });
    }
    return NextResponse.json({ error: "Registration is temporarily unavailable. Please try again later." }, { status: 503 });
  }
}