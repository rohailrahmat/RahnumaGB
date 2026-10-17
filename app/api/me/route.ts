import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    return NextResponse.json({ user: await getCurrentUser() });
  } catch (error) {
    console.error("User session could not be loaded:", error);
    return NextResponse.json({ error: "Session service is temporarily unavailable." }, { status: 503 });
  }
}