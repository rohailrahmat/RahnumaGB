import type { Destination } from "@/lib/types";

export function getOpenStreetMapEmbedUrl(destination: Pick<Destination, "lat" | "lng">, padding = 0.18) {
  const west = (destination.lng - padding).toFixed(5);
  const south = (destination.lat - padding).toFixed(5);
  const east = (destination.lng + padding).toFixed(5);
  const north = (destination.lat + padding).toFixed(5);
  const latitude = destination.lat.toFixed(5);
  const longitude = destination.lng.toFixed(5);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${west}%2C${south}%2C${east}%2C${north}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

export function getOpenStreetMapDirectionsUrl(points: Array<Pick<Destination, "lat" | "lng">>) {
  const route = points.map((point) => `${point.lat},${point.lng}`).join(";");
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(route)}`;
}

export function getOpenStreetMapLocationUrl(destination: Pick<Destination, "lat" | "lng">) {
  return `https://www.openstreetmap.org/?mlat=${destination.lat}&mlon=${destination.lng}#map=10/${destination.lat}/${destination.lng}`;
}
