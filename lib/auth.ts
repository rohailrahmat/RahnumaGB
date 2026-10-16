import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { ensureSchema, getSql } from "@/lib/db";

export const SESSION_COOKIE = "rehnuma_session";
const SESSION_AGE = 60 * 60 * 24 * 30;

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.VERCEL) {
    throw new Error("Set SESSION_SECRET in the Vercel project environment.");
  }
  return new TextEncoder().encode(secret || localSessionSecret());
}

function localSessionSecret() {
  const path = join(process.cwd(), "data", ".session-secret");
  if (existsSync(path)) return readFileSync(path, "utf8").trim();

  const generated = randomBytes(32).toString("base64url");
  try {
    writeFileSync(path, generated, { encoding: "utf8", flag: "wx", mode: 0o600 });
    return generated;
  } catch {
    return readFileSync(path, "utf8").trim();
  }
}

export async function signInToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_AGE}s`)
    .sign(secretKey());
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const verified = await jwtVerify(token, secretKey()).catch(() => null);
  if (!verified?.payload.sub) return null;
  await ensureSchema();
  const users = await getSql()`SELECT id, name, email, created_at FROM app_users WHERE id = ${verified.payload.sub} LIMIT 1`;
  return users[0] ?? null;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_AGE,
};