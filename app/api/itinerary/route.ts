import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createItinerary } from "@/lib/rag";

export const maxDuration = 60;

const itinerarySchema = z.object({
  days: z.number().int().min(1).max(21),
  budget: z.number().int().min(1000).max(10000000),
  interests: z.string().trim().min(2).max(250),
});

export async function POST(request: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Sign in to build a trip plan." }, { status: 401 });
  const parsed = itinerarySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Add a duration, budget and a few interests." }, { status: 400 });
  try {
    return NextResponse.json(await createItinerary(parsed.data.days, parsed.data.budget, parsed.data.interests));
  } catch (error) {
    console.error("Itinerary request failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "The planner is unavailable right now." }, { status: 503 });
  }
}