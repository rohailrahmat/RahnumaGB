import destinationsJson from "@/data/destinations.json";
import guidesJson from "@/data/guides.json";
import type { Destination, Guide } from "@/lib/types";

export const destinations = destinationsJson as Destination[];
export const guides = guidesJson as Guide[];

export const tripOrigins = [
  { id: "gilgit", name: "Gilgit City", lat: 35.92, lng: 74.31 },
  { id: "skardu", name: "Skardu", lat: 35.30, lng: 75.63 },
  { id: "hunza", name: "Hunza", lat: 36.32, lng: 74.66 },
] as const;

export const destinationImages: Record<string, string> = {
  hunza: "/static/images/hero.webp",
  skardu: "/static/images/skardu.webp",
  deosai: "/static/images/deosai.webp",
  "fairy-meadows": "/static/images/fairy-meadows.webp",
  naltar: "/static/images/naltar.webp",
  shigar: "/static/images/shigar.webp",
  khaplu: "/static/images/khaplu.webp",
  phander: "/static/images/phander.webp",
  yasin: "/static/images/yasin.webp",
  ishkoman: "/static/images/phander.webp",
};

export function getDestinationImage(id: string) {
  return destinationImages[id] ?? "/static/images/hero.webp";
}

export function formatPKR(amount: number) {
  return new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(amount);
}