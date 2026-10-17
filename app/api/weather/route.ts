import { NextResponse } from "next/server";
import { z } from "zod";

export const maxDuration = 15;

const weatherLocations = [
  { id: "gilgit", name: "Gilgit", lat: 35.92, lng: 74.31 },
  { id: "hunza", name: "Hunza", lat: 36.32, lng: 74.66 },
  { id: "skardu", name: "Skardu", lat: 35.30, lng: 75.63 },
  { id: "yasin", name: "Yasin", lat: 36.37758437, lng: 73.33364387 },
  { id: "ishkoman", name: "Ishkoman", lat: 36.50889098, lng: 73.92128426 },
  { id: "phander", name: "Phander", lat: 36.17, lng: 72.95 },
];

const forecastSchema = z.object({
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    apparent_temperature: z.number(),
    relative_humidity_2m: z.number(),
    precipitation: z.number(),
    weather_code: z.number(),
    wind_speed_10m: z.number(),
  }),
  daily: z.object({
    time: z.array(z.string()),
    weather_code: z.array(z.number()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    precipitation_probability_max: z.array(z.number()),
  }),
});

export async function GET() {
  const endpoint = new URL("https://api.open-meteo.com/v1/forecast");
  endpoint.searchParams.set("latitude", weatherLocations.map((location) => location.lat).join(","));
  endpoint.searchParams.set("longitude", weatherLocations.map((location) => location.lng).join(","));
  endpoint.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m");
  endpoint.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
  endpoint.searchParams.set("forecast_days", "3");
  endpoint.searchParams.set("timezone", "Asia/Karachi");

  let response: Response;
  try {
    response = await fetch(endpoint, { signal: AbortSignal.timeout(12_000), cache: "no-store" });
  } catch (error) {
    console.error("Weather provider request failed:", error);
    return NextResponse.json({ error: "Live forecasts are temporarily unavailable." }, { status: 503 });
  }

  if (!response.ok) {
    console.error("Weather provider returned an unsuccessful response:", response.status);
    return NextResponse.json({ error: "Live forecasts are temporarily unavailable." }, { status: 503 });
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    console.error("Weather provider returned invalid JSON:", error);
    return NextResponse.json({ error: "Live forecasts are temporarily unavailable." }, { status: 502 });
  }
  const forecasts = Array.isArray(payload) ? payload : [payload];
  if (forecasts.length !== weatherLocations.length) {
    console.error("Weather provider returned an unexpected number of locations.");
    return NextResponse.json({ error: "Live forecasts are temporarily unavailable." }, { status: 502 });
  }

  const parsedForecasts = z.array(forecastSchema).safeParse(forecasts);
  if (!parsedForecasts.success) {
    console.error("Weather provider returned an unexpected forecast shape:", parsedForecasts.error.issues);
    return NextResponse.json({ error: "Live forecasts are temporarily unavailable." }, { status: 502 });
  }

  const places = weatherLocations.map((location, index) => ({ ...location, ...parsedForecasts.data[index] }));

  return NextResponse.json(
    { places, provider: "Open-Meteo", retrievedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } },
  );
}
