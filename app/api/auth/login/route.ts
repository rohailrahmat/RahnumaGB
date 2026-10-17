import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, sessionCookieOptions, signInToken } from "@/lib/auth";
import { ensureSchema, getSql } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });

  try {
    await ensureSchema();
    const email = parsed.data.email.toLowerCase();
    const users = await getSql()`SELECT id, name, email, password_hash FROM app_users WHERE email = ${email} LIMIT 1`;
    const user = users[0];
    if (!user || !(await compare(parsed.data.password, String(user.password_hash)))) {
      return NextResponse.json({ error: "Email or password doesn’t match." }, { status: 401 });
    }
    const token = await signInToken(String(user.id));
    const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Sign in is temporarily unavailable. Please try again later." }, { status: 503 });
  }
}