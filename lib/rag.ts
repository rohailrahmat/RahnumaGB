import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { GoogleGenAI } from "@google/genai";
import { destinations, guides, tripOrigins } from "@/lib/data";
import type { ChatMessage, Destination, Guide } from "@/lib/types";
import { z } from "zod";
import officialKnowledgeJson from "@/data/official-knowledge.json";

type IndexChunk = { dest?: string; type?: string; guide_id?: string; section?: string; text: string; hidden?: boolean; vec?: number[]; source_url?: string; source_label?: string; keywords?: string[]; id?: string };
type Pin = Pick<Destination, "id" | "name" | "lat" | "lng">;
type OfficialChunk = {
  id: string;
  dest?: string;
  section: string;
  title: string;
  keywords: string[];
  text: string;
  source_url: string;
  source_label: string;
  checked_on: string;
};

const officialKnowledge = officialKnowledgeJson as OfficialChunk[];
const SYSTEM = `You are Rahnuma, a concise travel guide for Gilgit-Baltistan, Pakistan. Answer directly and warmly. Prefer the official tourism context when it is relevant, and never turn its approximate distances or reference coordinates into guaranteed travel times or entrances. Use supplied destination context for routes, seasons, altitude, safety, and PKR costs; do not invent facts, prices, live road conditions, emergency numbers, event dates, or services. For live conditions, link the official current resource included in context. If sources conflict or are incomplete, say what is uncertain. Respect the distinct cultures of local communities and do not generalize rituals. If a question is outside the region, say so briefly. Recommend a named guide only when asked about guides, booking, transport, or a route that requires one. Keep replies scannable and practical.`;
const generationModels = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-flash-lite-latest"];
const guideIntent = /guide|driver|jeep|book|contact|whatsapp|hire|operator|porter/i;
let indexPromise: Promise<IndexChunk[]> | undefined;

function aiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured. Add a Gemini API key to .env.local.");
  return new GoogleGenAI({ apiKey });
}

async function loadIndex() {
  indexPromise ??= readFile(join(process.cwd(), "data", "index.json"), "utf8").then((value) => JSON.parse(value) as IndexChunk[]);
  return indexPromise;
}

async function embed(text: string) {
  const response = await aiClient().models.embedContent({ model: "gemini-embedding-001", contents: text });
  const values = response.embeddings?.[0]?.values;
  if (!values?.length) throw new Error("The travel index could not be searched right now.");
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  return values.map((value) => value / (magnitude || 1));
}

function relevance(query: string, chunk: IndexChunk) {
  const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
  const text = chunk.text.toLowerCase();
  const lexical = terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0) / Math.max(terms.length, 1);
  return lexical + (guideIntent.test(query) && chunk.type === "guide" ? 0.08 : 0) + (/quiet|hidden|peaceful|remote/i.test(query) && chunk.hidden ? 0.05 : 0);
}

function officialRelevance(query: string, chunk: OfficialChunk) {
  const terms = [...new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2))];
  if (!terms.length) return 0;
  const searchable = `${chunk.title} ${chunk.keywords.join(" ")} ${chunk.text}`.toLowerCase();
  const matched = terms.filter((term) => searchable.includes(term)).length;
  const phraseBoost = searchable.includes(query.trim().toLowerCase()) ? 0.4 : 0;
  const keywordHits = terms.filter((term) => chunk.keywords.some((keyword) => keyword.toLowerCase().includes(term))).length;
  return matched / terms.length + phraseBoost + keywordHits / terms.length * 0.25;
}

async function retrieve(query: string, limit = 5) {
  const [index, queryVector] = await Promise.all([loadIndex(), embed(query)]);
  const indexedMatches = index.map((chunk) => {
    const cosine = chunk.vec?.reduce((sum, value, position) => sum + value * (queryVector[position] ?? 0), 0) ?? 0;
    return { chunk, score: cosine + relevance(query, chunk) };
  }).sort((left, right) => right.score - left.score).slice(0, limit).map(({ chunk }) => chunk);
  const officialMatches = officialKnowledge
    .map((chunk) => ({ chunk, score: officialRelevance(query, chunk) }))
    .filter(({ score }) => score >= 0.3)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ chunk }) => ({ ...chunk, type: "official" }));
  const combined = [...officialMatches, ...indexedMatches];
  return [...new Map(combined.map((chunk) => [chunk.id ?? `${chunk.dest}:${chunk.section}:${chunk.text}`, chunk])).values()];
}

function relatedItems(chunks: IndexChunk[], query: string) {
  const destinationIds = [...new Set(chunks.filter((chunk) => chunk.type !== "guide" && chunk.dest && (chunk.type !== "official" || chunk.section === "official-destination")).map((chunk) => chunk.dest as string))];
  const sourceChunks = chunks.filter((chunk) => chunk.type !== "guide");
  const sourceEntries = sourceChunks.map((chunk) => ({
    dest: chunk.type === "official" && chunk.section !== "official-destination" ? "" : chunk.dest ?? "",
    section: chunk.section ?? "overview",
    label: chunk.source_label ?? destinations.find((item) => item.id === chunk.dest)?.name ?? chunk.dest ?? "Regional travel guide",
    ...(chunk.source_url ? { url: chunk.source_url } : {}),
  }));
  const sources = [...new Map(sourceEntries.map((source) => [`${source.url ?? source.dest}:${source.section}`, source])).values()];
  const pins = destinationIds.flatMap((id) => {
    const item = destinations.find((destination) => destination.id === id);
    return item ? [{ id: item.id, name: item.name, lat: item.lat, lng: item.lng }] : [];
  }) as Pin[];
  let matchedGuides = chunks.filter((chunk) => chunk.type === "guide").map((chunk) => chunk.guide_id ?? chunk.dest);
  if (guideIntent.test(query) && !matchedGuides.length) matchedGuides = guides.slice(0, 3).map((guide) => guide.id);
  const guideResults = matchedGuides.flatMap((id) => {
    const item = guides.find((guide) => guide.id === id);
    return item ? [item] : [];
  });
  return { sources, pins, guides: guideResults };
}

async function generate(contents: string, json = false) {
  const client = aiClient();
  let lastError: unknown;

  for (const model of generationModels) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await client.models.generateContent({
          model,
          contents,
          config: { systemInstruction: SYSTEM, ...(json ? { responseMimeType: "application/json" } : {}) },
        });
        return response.text ?? "I couldn’t prepare an answer just now. Please try again.";
      } catch (error) {
        lastError = error;
        const status = typeof error === "object" && error !== null && "status" in error
          ? Number(error.status)
          : 0;
        const unavailable = status === 404 || status === 429 || status === 503 || /high demand|not found|no longer available/i.test(String(error));
        if (!unavailable) throw error;
        if (attempt === 0 && (status === 429 || status === 503)) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else {
          break;
        }
      }
    }
  }

  throw lastError ?? new Error("No Gemini generation model is currently available.");
}

export async function answerTravelQuestion(query: string, history: ChatMessage[] = []) {
  const chunks = await retrieve(query);
  const related = relatedItems(chunks, query);
  const context = chunks.map((chunk) => `[${chunk.dest ?? "regional"}/${chunk.section ?? "data"}${chunk.source_url ? ` | ${chunk.source_label}: ${chunk.source_url}` : ""}] ${chunk.text}`).join("\n\n");
  const conversation = history.slice(-8).map((message) => `${message.role === "user" ? "Traveler" : "Rahnuma"}: ${message.content}`).join("\n");
  const text = await generate(`${conversation ? `Recent conversation:\n${conversation}\n\n` : ""}Verified regional knowledge:\n${context || "No destination records matched."}\n\nTraveler question: ${query}\n\nAnswer directly using the verified context. If a guide is relevant, use only the guide details below.\n${related.guides.slice(0, 3).map((guide: Guide) => `${guide.name}, ${guide.company}; WhatsApp ${guide.whatsapp}; ${guide.region}; ${guide.license}`).join("\n")}`);
  return { text, ...related };
}

const generatedItinerarySchema = z.object({
  days: z.array(z.object({
    day: z.number().int().positive(),
    dest_id: z.string().min(1),
    title: z.string().min(2).max(120),
    plan: z.string().min(20).max(5000),
    cost_pkr: z.number().int().nonnegative().nullable(),
  })).min(1).max(21),
  safety_note: z.string().min(1).max(1000),
});

export async function createItinerary(days: number, budget: number, interests: string, startLocationId: string) {
  const origin = tripOrigins.find((item) => item.id === startLocationId);
  if (!origin) throw new Error("Choose a valid starting point for your journey.");
  const chunks = await retrieve(`${origin.name} ${interests} trip in Gilgit-Baltistan`, 8);
  const related = relatedItems(chunks, interests);
  const context = chunks.map((chunk) => `[${chunk.dest ?? "regional"}/${chunk.section ?? "data"}${chunk.source_url ? ` | ${chunk.source_label}: ${chunk.source_url}` : ""}] ${chunk.text}`).join("\n\n");
  const response = await generate(`Context:\n${context}\n\nCreate a ${days}-day Gilgit-Baltistan itinerary for ${budget} PKR total, starting in ${origin.name}. Traveler interests: ${interests}. Use only destination IDs present in the context. Return exactly ${days} ordered day entries and keep the journey geographically coherent from the starting point. Make each day's plan practical and specific: use Markdown headings for Morning, Afternoon, Evening, and Getting around; include activities and advice grounded in the context; allow realistic rest and altitude adjustment; avoid invented opening times, road durations, hotels, restaurants, and transport prices. Keep the estimated day cost within the overall budget when possible; use null when the supplied data cannot support an estimate. Return JSON only with this shape: {"days":[{"day":1,"dest_id":"...","title":"...","plan":"## Morning\\n...\\n## Afternoon\\n...\\n## Evening\\n...\\n## Getting around\\n...","cost_pkr":number|null}],"safety_note":"..."}.`, true);
  let parsedResponse: unknown;
  try {
    parsedResponse = JSON.parse(response.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    throw new Error("The trip planner returned an unreadable itinerary. Please try again.");
  }
  const plan = generatedItinerarySchema.safeParse(parsedResponse);
  if (!plan.success || plan.data.days.length !== days || plan.data.days.some((day, index) => day.day !== index + 1)) {
    throw new Error("The trip planner could not create a complete day-by-day route. Please try again.");
  }
  const unknownDestination = plan.data.days.find((day) => !destinations.some((destination) => destination.id === day.dest_id));
  if (unknownDestination) throw new Error("The trip planner returned an unknown destination. Please try again.");
  const pins = [...new Set(plan.data.days.map((day) => day.dest_id))].flatMap((id) => {
    const destination = destinations.find((item) => item.id === id);
    return destination ? [{ id, name: destination.name, lat: destination.lat, lng: destination.lng }] : [];
  });
  return { ...plan.data, origin, pins, guides: related.guides.slice(0, 3) };
}