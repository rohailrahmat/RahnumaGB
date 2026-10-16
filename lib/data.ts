import destinationsJson from "@/data/destinations.json";
import guidesJson from "@/data/guides.json";
import type { Destination, Guide } from "@/lib/types";

export const destinations = destinationsJson as Destination[];
export const guides = guidesJson as Guide[];

export const destinationImages: Record<string, string> = {
  hunza: "/static/images/hero.jpg",
  skardu: "/static/images/skardu.jpg",
  deosai: "/static/images/deosai.jpg",
  "fairy-meadows": "/static/images/fairy-meadows.jpg",
  naltar: "/static/images/naltar.jpg",
  shigar: "/static/images/shigar.jpg",
  khaplu: "/static/images/khaplu.jpg",
  phander: "/static/images/phander.jpg",
  yasin: "/static/images/yasin.jpg",
  ishkoman: "/static/images/phander.jpg",
};

export function getDestinationImage(id: string) {
  return destinationImages[id] ?? "/static/images/hero.jpg";
}

export function formatPKR(amount: number) {
  return new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(amount);
}