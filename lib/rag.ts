import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { GoogleGenAI } from "@google/genai";
import { destinations, guides } from "@/lib/data";
import type { ChatMessage, Destination, Guide } from "@/lib/types";

type IndexChunk = { dest: string; type?: string; guide_id?: string; section?: string; text: string; hidden?: boolean; vec: number[] };
type Pin = Pick<Destination, "id" | "name" | "lat" | "lng">;

const SYSTEM = `You are Rehnuma, a concise travel guide for Gilgit-Baltistan, Pakistan. Answer directly and warmly. Use the supplied verified context for destinations, routes, seasons, altitude, safety, and PKR costs; do not invent facts or prices. If a question is outside the region, say so briefly. Recommend a named guide only when asked about guides, booking, transport, or a route that requires one. Keep replies scannable and practical.`;
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

async function retrieve(query: string, limit = 5) {
  const [index, queryVector] = await Promise.all([loadIndex(), embed(query)]);
  return index.map((chunk) => {
    const cosine = chunk.vec.reduce((sum, value, position) => sum + value * (queryVector[position] ?? 0), 0);
    return { chunk, score: cosine + relevance(query, chunk) };
  }).sort((left, right) => right.score - left.score).slice(0, limit).map(({ chunk }) => chunk);
}

function relatedItems(chunks: IndexChunk[], query: string) {
  const destinationIds = [...new Set(chunks.filter((chunk) => chunk.type !== "guide").map((chunk) => chunk.dest))];
  const sourceChunks = chunks.filter((chunk) => chunk.type !== "guide");
  const sources = [...new Map(sourceChunks.map((chunk) => [`${chunk.dest}:${chunk.section}`, { dest: chunk.dest, section: chunk.section ?? "overview", label: destinations.find((item) => item.id === chunk.dest)?.name ?? chunk.dest }])).values()];
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
  const context = chunks.map((chunk) => `[${chunk.dest}/${chunk.section ?? "data"}] ${chunk.text}`).join("\n\n");
  const conversation = history.slice(-8).map((message) => `${message.role === "user" ? "Traveler" : "Rehnuma"}: ${message.content}`).join("\n");
  const text = await generate(`${conversation ? `Recent conversation:\n${conversation}\n\n` : ""}Verified regional knowledge:\n${context || "No destination records matched."}\n\nTraveler question: ${query}\n\nAnswer directly using the verified context. If a guide is relevant, use only the guide details below.\n${related.guides.slice(0, 3).map((guide: Guide) => `${guide.name}, ${guide.company}; WhatsApp ${guide.whatsapp}; ${guide.region}; ${guide.license}`).join("\n")}`);
  return { text, ...related };
}

export async function createItinerary(days: number, budget: number, interests: string) {
  const chunks = await retrieve(`${interests} trip in Gilgit-Baltistan`, 8);
  const related = relatedItems(chunks, interests);
  const context = chunks.map((chunk) => `[${chunk.dest}/${chunk.section ?? "data"}] ${chunk.text}`).join("\n\n");
  const response = await generate(`Context:\n${context}\n\nPlan a ${days}-day Gilgit-Baltistan trip for a total budget of ${budget} PKR. Interests: ${interests}. Use destinations from context only. Return JSON: {"days":[{"day":1,"dest_id":"...","title":"...","plan":"...","cost_pkr":number|null}],"safety_note":"..."}. Use null rather than inventing costs.`, true);
  const plan = JSON.parse(response.replace(/^```(?:json)?\s*|\s*```$/g, "")) as { days?: Array<{ dest_id: string }>; safety_note?: string };
  const pins = [...new Set((plan.days ?? []).map((day) => day.dest_id))].flatMap((id) => {
    const destination = destinations.find((item) => item.id === id);
    return destination ? [{ id, name: destination.name, lat: destination.lat, lng: destination.lng }] : [];
  });
  return { ...plan, pins, guides: related.guides.slice(0, 3) };
}